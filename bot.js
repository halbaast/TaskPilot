
const TelegramBot = require('node-telegram-bot-api');

// Get bot token from environment variable
const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('ERROR: BOT_TOKEN environment variable is not set!');
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Store task messages for reaction tracking
const taskMessages = new Map();

console.log('✅ Bot is running...');

// Listen for messages in the group
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  // Skip if it's a command or from the bot itself
  if (!text || text.startsWith('/') || msg.from.is_bot) return;
  
  // Parse task format: Task Type | Client | Deadline | Assignee
  // Example: "Editing | ABC Corp | 2025-10-05 | @john"
  const parts = text.split('|').map(p => p.trim());
  
  if (parts.length === 4) {
    const [taskType, client, deadline, assignee] = parts;
    
    // Get the person who assigned the task
    const assignedBy = msg.from.username 
      ? `@${msg.from.username}` 
      : msg.from.first_name;
    
    // Format the task message
    const taskMessage = `
📋 *NEW TASK*

*Task:* ${taskType}
*Client:* ${client}
*Deadline:* ${deadline}
*Assigned to:* ${assignee}
*Assigned by:* ${assignedBy}

*Status:* ⏳ Pending

_React with ✅ to mark complete or ❌ to cancel_
    `;
    
    // Delete the original message first
    bot.deleteMessage(chatId, msg.message_id)
      .then(() => {
        // Then send formatted task message
        return bot.sendMessage(chatId, taskMessage, { parse_mode: 'Markdown' });
      })
      .then((sentMsg) => {
        // Store task info for later updates
        taskMessages.set(sentMsg.message_id, {
          chatId: chatId,
          taskType: taskType,
          client: client,
          deadline: deadline,
          assignee: assignee,
          assignedBy: assignedBy,
          status: 'pending'
        });
      })
      .catch(err => {
        console.error('Error:', err);
        // If deletion fails, still send the formatted message
        bot.sendMessage(chatId, taskMessage, { parse_mode: 'Markdown' });
      });
  }
});

// Listen for message reactions
bot.on('message_reaction', (reaction) => {
  const messageId = reaction.message_id;
  const taskInfo = taskMessages.get(messageId);
  
  if (!taskInfo) return;
  
  const newReaction = reaction.new_reaction[0];
  if (!newReaction) return;
  
  let newStatus = '';
  let statusEmoji = '';
  
  // Check reaction type
  if (newReaction.emoji === '👍') {
    newStatus = 'completed';
    statusEmoji = '👍';
  } else if (newReaction.emoji === '👎') {
    newStatus = 'cancelled';
    statusEmoji = '👎';
  }
  
  if (newStatus) {
    taskInfo.status = newStatus;
    
    const updatedMessage = `
📋 *TASK ${newStatus.toUpperCase()}*

*Task:* ${taskInfo.taskType}
*Client:* ${taskInfo.client}
*Deadline:* ${taskInfo.deadline}
*Assigned to:* ${taskInfo.assignee}
*Assigned by:* ${taskInfo.assignedBy}

*Status:* ${statusEmoji} ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}

_Updated by @${reaction.user.username || reaction.user.first_name}_
    `;
    
    bot.editMessageText(updatedMessage, {
      chat_id: taskInfo.chatId,
      message_id: messageId,
      parse_mode: 'Markdown'
    }).catch(err => console.error('Error updating message:', err));
  }
});

// Command to show help
bot.onText(/\/start/, (msg) => {
  const helpText = `
🤖 *Agency Task Bot*

*How to use:*
Send a task in this format:
\`Task Type | Client | Deadline | @assignee\`

*Example:*
\`Editing | ABC Corp | 2025-10-05 | @john\`

The bot will delete your message and format it nicely. React with ✅ to mark complete or ❌ to cancel.

*Note:* Bot needs admin permissions to delete messages and read reactions!
  `;
  
  bot.sendMessage(msg.chat.id, helpText, { parse_mode: 'Markdown' });
});

// Health check endpoint for hosting platforms
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Telegram Task Bot is running! 🤖');
});

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);

});
