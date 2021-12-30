const Discord = require('discord.js');
const Case = require('../../database/models/case');
const Welcome = require('../../database/models/Welcome')

module.exports = {
    name: 'kick',
    description: 'Kick the provided user from the server',
    guildOnly: true,
    args: true,
    usage: '@user [reason]',
    usages: ["kick @user", "kick @user <reason>"],

    exemple: '@pauldb09 spam',
    cat: 'moderation',
    permissions: ['BAN_MEMBERS'],
    botpermissions: ["BAN_MEMBERS"],
    async execute(message, args, client) {

        let tran = await message.translate("KICK");


        let user = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.guild.members.cache.filter(m => m.user.tag.toLowerCase().includes(args[0].toLowerCase()) || m.displayName.toLowerCase().includes(args[0].toLowerCase()) || m.user.username.toLowerCase().includes(args[0].toLowerCase())).first()
        if (!user || user.id == message.client.user.id) {
            let err = await message.translate("ERROR_USER")
            return message.errorMessage(err)
        }
        const modErr = await message.translate("MODERATION")
        if (user.id === message.author.id) {
            return message.errorMessage(modErr.you)
        }


        // Gets the ban reason
        let reason = args.slice(1).join(" ");
        if (!reason) {
            reason = modErr.raison;
        }

        const member = await message.guild.members.fetch(user.id).catch(() => {});
        if (member) {
            if (user.id === message.guild.OWNER) return message.errorMessage(modErr.owner)
            const memberPosition = member.roles.highest.position;
            const moderationPosition = message.member.roles.highest.position;
            if (message.guild.OWNER !== message.author.id && !(moderationPosition > memberPosition)) {
                return message.errorMessage(modErr.superior)

            }


        }

        await user.send({
            embeds: [new Discord.MessageEmbed().setDescription(tran.dm.replace("{message.guild.name}", message.guild.name).replace("{member.user.tag}", member.user.tag).replace("{reason}", reason)).setColor(message.guild.settings.color)]
        }).catch(() => {});

        // Ban the user
        message.guild.members.kick(user, { reason: `${reason} ( ${tran.by} ${message.author.tag})` }).then(async() => {
            var chars = "ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
            var string_length = 10;
            var randomstring = '';

            for (var x = 0; x < string_length; x++) {

                var letterOrNumber = Math.floor(Math.random() * 2);
                if (letterOrNumber == 0) {
                    var newNum = Math.floor(Math.random() * 9);
                    randomstring += newNum;
                } else {
                    var rnum = Math.floor(Math.random() * chars.length);
                    randomstring += chars.substring(rnum, rnum + 1);
                }

            }
            const uniqID = randomstring;
            // Send a success message in the current channel
            message.reply({
                embeds: [new Discord.MessageEmbed().setAuthor(tran.name, member.user.displayAvatarURL()).setDescription(`\`📚\` **${member.user.tag}** ${tran.desc} **${message.author.tag}**  \n\n __\`📃\`${tran.raison}__ : ${reason}.`).setColor(message.guild.settings.color).setFooter(`Case id: ${uniqID} | ${message.guild.settings.prefix}case ${uniqID}`, message.client.user.displayAvatarURL())]
            })

            const verynew = new Case({
                serverID: message.guild.id,
                id: uniqID,
                targetID: member.id,
                sanction: "Kick",
                reason: reason,
                mod: message.member.id,
            }).save()

            const logs = await Welcome.findOne({ serverID: message.guild.id, reason: `mod-logs` })
            if (logs) {
                if (message.guild.channels.cache.get(logs.channelID)) {
                    const translations = await message.translate("LOGS_MOD")
                    const embed = new Discord.MessageEmbed()
                        .setColor(message.guild.settings.color)
                        .setAuthor(`${member.user.username}`, member.user.displayAvatarURL({ dynamic: true, size: 512 }))
                        .setTitle(translations.title.replace("{id}", uniqID))
                        .setDescription(translations.desc.replace("{user}", message.member.user.tag).replace("{member}", member.user.tag))
                        .addField("<:membres:830432144211705916> " + translations.mod + "", `\`${message.member.user.tag}\` \n(<@!${message.member.id}>)`, true)
                        .addField("<:663041911753277442:830432143800532993> Type", "Kick", true)
                        .addField("<:green_members:811167997023485973> " + translations.target + "", `\`${member.user.tag}\` \n(<@!${member.id}>)`, true)
                        .addField("<:711541810098470913:830460210220630027> Case ID", `${uniqID}`, true)
                        .addField("<:612058498108227586:830440548007018517> " + translations.reason + "", `${reason}`, true)

                    .setThumbnail(url = message.client.user.displayAvatarURL({ dynamic: true, size: 512 }))
                        .setFooter(message.client.footer, message.client.user.displayAvatarURL({ dynamic: true, size: 512 }))
                    message.guild.channels.cache.get(logs.channelID).send({ embeds: [embed] })
                }
            }


        }).catch((err) => {
            if (message.client.log) console.log(err)
            return message.errorMessage(modErr.bot)
        });




    },
};