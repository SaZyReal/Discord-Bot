import { ChannelType, Client } from "discord.js";
import { Router } from "express";
import { prisma } from "../../database/client";
import { ensureGuildExists } from "../../database/client";
import { listManageableGuilds } from "../../services/adminService";
import { assertCanSendInChannel, PermissionError } from "../../services/permissionService";
import { postNewButtonMessage, addButtonToMessage, deleteButton } from "../../services/buttonService";
import { requireAuth, requireGuildAdmin } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { LOG_EVENT_TYPES, BUTTON_STYLES, ButtonStyleName } from "../../config/constants";
import { ActionPayload } from "../../actions/types";
import { NewButtonInput } from "../../services/buttonService";

function redirectWithStatus(res: any, guildId: string, status: "success" | "error", msg: string) {
  const params = new URLSearchParams({ status, msg });
  res.redirect(`/dashboard/${guildId}?${params.toString()}`);
}

export function createDashboardRouter(client: Client): Router {
  const router = Router();

  router.use(requireAuth);

  // ─── Liste des serveurs administrables ───────────────────────────
  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const guilds = await listManageableGuilds(client, req.session.user!.id);
      res.render("guilds", { guilds, user: req.session.user });
    })
  );

  // Tout ce qui suit nécessite d'être admin du serveur ciblé.
  router.use("/:guildId", requireGuildAdmin(client));

  // ─── Page principale du panel pour un serveur ────────────────────
  router.get(
    "/:guildId",
    asyncHandler(async (req, res) => {
    const { guildId } = req.params;
    const guild = res.locals.guild;
    await ensureGuildExists(guildId, guild.name);

    const [welcomeConfig, logConfig, buttons, adminRoles] = await Promise.all([
      prisma.welcomeConfig.findUnique({ where: { guildId } }),
      prisma.logConfig.findUnique({ where: { guildId } }),
      prisma.buttonConfig.findMany({ where: { guildId }, orderBy: { createdAt: "desc" } }),
      prisma.adminRole.findMany({ where: { guildId } }),
    ]);

    const textChannels = guild.channels.cache
      .filter((c: any) => c.type === ChannelType.GuildText || c.type === ChannelType.GuildAnnouncement)
      .map((c: any) => ({ id: c.id, name: c.name }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name));

    const roles = guild.roles.cache
      .filter((r: any) => !r.managed && r.name !== "@everyone")
      .map((r: any) => ({ id: r.id, name: r.name }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name));

    // Regroupe les boutons par message pour l'affichage et pour le sélecteur
    // "ajouter à un message existant".
    const messagesWithButtons = Object.values(
      buttons.reduce((acc: Record<string, any>, btn: any) => {
        const key = `${btn.channelId}:${btn.messageId}`;
        if (!acc[key]) {
          acc[key] = {
            channelId: btn.channelId,
            messageId: btn.messageId,
            channelName: textChannels.find((c: any) => c.id === btn.channelId)?.name ?? btn.channelId,
            buttons: [],
          };
        }
        acc[key].buttons.push(btn);
        return acc;
      }, {})
    );

    res.render("dashboard", {
      guild,
      welcomeConfig,
      logConfig: logConfig
        ? { ...logConfig, eventsList: JSON.parse(logConfig.events) as string[] }
        : null,
      messagesWithButtons,
      textChannels,
      roles,
      adminRoles,
      logEventTypes: LOG_EVENT_TYPES,
      buttonStyles: BUTTON_STYLES,
      status: req.query.status,
      msg: req.query.msg,
    });
    })
  );

  // ─── Envoi d'un message simple ────────────────────────────────────
  router.post(
    "/:guildId/messages/send",
    asyncHandler(async (req, res) => {
    const { guildId } = req.params;
    const { channelId, content } = req.body;
    const guild = res.locals.guild;

    if (!channelId || !content?.trim()) {
      return redirectWithStatus(res, guildId, "error", "Le salon et le contenu du message sont obligatoires.");
    }

    try {
      const channel = await assertCanSendInChannel(guild, channelId);
      await channel.send({ content });
      redirectWithStatus(res, guildId, "success", "Message envoyé.");
    } catch (err) {
      const message = err instanceof PermissionError ? err.message : "Erreur inattendue lors de l'envoi.";
      if (!(err instanceof PermissionError)) console.error("[dashboard] envoi de message :", err);
      redirectWithStatus(res, guildId, "error", message);
    }
    })
  );

  // ─── Configuration du message de bienvenue ───────────────────────
  router.post(
    "/:guildId/welcome",
    asyncHandler(async (req, res) => {
    const { guildId } = req.params;
    const { channelId, message, isEmbed, embedColor, enabled } = req.body;

    if (!channelId || !message?.trim()) {
      return redirectWithStatus(res, guildId, "error", "Le salon et le message sont obligatoires.");
    }

    await prisma.welcomeConfig.upsert({
      where: { guildId },
      update: {
        channelId,
        message,
        isEmbed: isEmbed === "on",
        embedColor: embedColor || null,
        enabled: enabled === "on",
      },
      create: {
        guildId,
        channelId,
        message,
        isEmbed: isEmbed === "on",
        embedColor: embedColor || null,
        enabled: enabled === "on",
      },
    });

    redirectWithStatus(res, guildId, "success", "Message de bienvenue enregistré.");
    })
  );

  // ─── Configuration des logs ───────────────────────────────────────
  router.post(
    "/:guildId/logs",
    asyncHandler(async (req, res) => {
    const { guildId } = req.params;
    const { channelId } = req.body;
    const selectedEvents: string[] = Array.isArray(req.body.events)
      ? req.body.events
      : req.body.events
        ? [req.body.events]
        : [];

    if (!channelId) {
      return redirectWithStatus(res, guildId, "error", "Le salon de logs est obligatoire.");
    }

    await prisma.logConfig.upsert({
      where: { guildId },
      update: { channelId, events: JSON.stringify(selectedEvents) },
      create: { guildId, channelId, events: JSON.stringify(selectedEvents) },
    });

    redirectWithStatus(res, guildId, "success", "Configuration des logs enregistrée.");
    })
  );

  // ─── Création d'un bouton (nouveau message ou message existant) ──
  router.post(
    "/:guildId/buttons",
    asyncHandler(async (req, res) => {
    const { guildId } = req.params;
    const guild = res.locals.guild;
    const {
      mode, // "new" | "existing"
      channelId,
      existingMessageId,
      content,
      label,
      emoji,
      style,
      actionType,
      roleId,
      successMessage,
      addedMessage,
      removedMessage,
      dmMessage,
      ephemeralMessage,
    } = req.body;

    if (!label?.trim() || !channelId) {
      return redirectWithStatus(res, guildId, "error", "Le salon et le libellé du bouton sont obligatoires.");
    }

    let payload: ActionPayload;
    try {
      payload = buildActionPayload(actionType, {
        roleId,
        successMessage,
        addedMessage,
        removedMessage,
        dmMessage,
        ephemeralMessage,
      });
    } catch (err) {
      return redirectWithStatus(res, guildId, "error", (err as Error).message);
    }

    const input: NewButtonInput = {
      label: label.trim(),
      emoji: emoji?.trim() || undefined,
      style: ((BUTTON_STYLES as readonly string[]).includes(style) ? style : "PRIMARY") as ButtonStyleName,
      actionType,
      actionPayload: JSON.stringify(payload),
    };

    try {
      if (mode === "existing" && existingMessageId) {
        await addButtonToMessage(guild, channelId, existingMessageId, input);
      } else {
        if (!content?.trim()) {
          return redirectWithStatus(res, guildId, "error", "Le contenu du nouveau message est obligatoire.");
        }
        await postNewButtonMessage(guild, channelId, content, input);
      }
      redirectWithStatus(res, guildId, "success", "Bouton créé.");
    } catch (err) {
      const message = err instanceof PermissionError || err instanceof Error ? err.message : "Erreur inattendue.";
      console.error("[dashboard] création de bouton :", err);
      redirectWithStatus(res, guildId, "error", message);
    }
    })
  );

  // ─── Suppression d'un bouton ──────────────────────────────────────
  router.post(
    "/:guildId/buttons/:buttonId/delete",
    asyncHandler(async (req, res) => {
    const { guildId, buttonId } = req.params;
    try {
      await deleteButton(guildId, buttonId, res.locals.guild);
      redirectWithStatus(res, guildId, "success", "Bouton supprimé.");
    } catch (err) {
      console.error("[dashboard] suppression de bouton :", err);
      redirectWithStatus(res, guildId, "error", "Erreur lors de la suppression du bouton.");
    }
    })
  );

  return router;
}

/** Construit un ActionPayload typé et valide à partir des champs bruts du formulaire. */
function buildActionPayload(
  actionType: string,
  fields: {
    roleId?: string;
    successMessage?: string;
    addedMessage?: string;
    removedMessage?: string;
    dmMessage?: string;
    ephemeralMessage?: string;
  }
): ActionPayload {
  switch (actionType) {
    case "ADD_ROLE":
      if (!fields.roleId) throw new Error("Un rôle est requis pour l'action « Donner un rôle ».");
      return { type: "ADD_ROLE", roleId: fields.roleId, successMessage: fields.successMessage || undefined };
    case "REMOVE_ROLE":
      if (!fields.roleId) throw new Error("Un rôle est requis pour l'action « Retirer un rôle ».");
      return { type: "REMOVE_ROLE", roleId: fields.roleId, successMessage: fields.successMessage || undefined };
    case "TOGGLE_ROLE":
      if (!fields.roleId) throw new Error("Un rôle est requis pour l'action « Basculer un rôle ».");
      return {
        type: "TOGGLE_ROLE",
        roleId: fields.roleId,
        addedMessage: fields.addedMessage || undefined,
        removedMessage: fields.removedMessage || undefined,
      };
    case "SEND_DM":
      if (!fields.dmMessage?.trim()) throw new Error("Le message privé ne peut pas être vide.");
      return { type: "SEND_DM", message: fields.dmMessage };
    case "EPHEMERAL_MESSAGE":
      if (!fields.ephemeralMessage?.trim()) throw new Error("Le message éphémère ne peut pas être vide.");
      return { type: "EPHEMERAL_MESSAGE", message: fields.ephemeralMessage };
    default:
      throw new Error("Type d'action inconnu.");
  }
}
