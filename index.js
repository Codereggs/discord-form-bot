require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const FORM_BASE_URL = process.env.FORM_BASE_URL;
const ENTRY_ID = process.env.ENTRY_ID;

client.on("ready", () => {
  console.log(`Bot listo como ${client.user.tag}`);
});

client.on("guildMemberAdd", async (member) => {
  try {
    const sinRegistrarRole = member.guild.roles.cache.find(
      ({ name }) => name === "Sin registrar"
    );
    if (!sinRegistrarRole) {
      return;
    }

    await member.roles.add(sinRegistrarRole);

    const registroChannel = member.guild.channels.cache.find(
      (c) => c.name === "registro"
    );
    if (!registroChannel || !registroChannel.isTextBased()) {
      return;
    }

    const formLink = `${FORM_BASE_URL}?usp=pp_url&${ENTRY_ID}=${member.id}`;

    const embed = new EmbedBuilder()
      .setTitle("📋 Registro")
      .setDescription(
        `¡Bienvenido <@${member.id}>! [Haz clic aquí para registrarte](${formLink})`
      )
      .setColor(0x00bfff);

    await registroChannel.send({ embeds: [embed] });
  } catch (error) {
    console.error(
      `Error al procesar nuevo miembro ${member.user.tag}:`,
      error.message
    );
    // Si no puede enviar el mensaje, al menos intenta asignar el rol
    try {
      const sinRegistrarRole = member.guild.roles.cache.find(
        (r) => r.name === "Sin registrar"
      );
      if (sinRegistrarRole) {
        await member.roles.add(sinRegistrarRole);
      }
    } catch (roleError) {
      console.error("Error asignando rol:", roleError.message);
    }
  }
});

client.on("guildMemberUpdate", async (oldMember, newMember) => {
  const registroChannel = newMember.guild.channels.cache.find(
    ({ name }) => name === "registro"
  );
  if (!registroChannel || !registroChannel.isTextBased()) return;

  const oldRoles = oldMember.roles.cache;
  const newRoles = newMember.roles.cache;

  const miembroRole = newMember.guild.roles.cache.find(
    ({ name }) => name === "Miembros"
  );
  if (!miembroRole) return;

  const obtuvoMiembros =
    !oldRoles.has(miembroRole.id) && newRoles.has(miembroRole.id);
  if (!obtuvoMiembros) return;

  // Limpiar mensajes de ese usuario en #registro
  try {
    const fetchedMessages = await registroChannel.messages.fetch({
      limit: 100,
    });
    const userMessages = fetchedMessages.filter(
      (msg) => msg.author.id === newMember.id
    );

    for (const [_, msg] of userMessages) {
      await msg.delete();
    }
  } catch (error) {
    console.error("Error limpiando mensajes:", error);
  }
});

client.login(process.env.DISCORD_TOKEN);
