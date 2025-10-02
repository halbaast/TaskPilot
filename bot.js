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

// Store user nicknames (userId -> nickname)
const userNicknames = new Map();

// Function to get display name (nickname or username/first name)
function getDisplayName(user) {
  if (!user) return 'Unknown';
  
  // Check if user has a saved nickname
  if (userNicknames.has(user.id)) {
    return userNicknames.get(user.id);
  }
  
  // Fall back to username or first name
  return user.username ? `@${user.username}` : user.first_name;
}

// Command to set nickname
bot.onText(/\/setname (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const nickname = match[1].trim();
  
  // Save the nickname
  userNicknames.set(userId, nickname);
  
  bot.sendMessage(chatId, `✅ Your name has been set to: *${nickname}*`, {
    parse_mode: 'Markdown'
  });
});

// Command to check your current name
bot.onText(/\/myname/, (msg) => {
  const chatId = msg.chat.id;
  const displayName = getDisplayName(msg.from);
  
  bot.sendMessage(chatId, `Your current name is: *${displayName}*\n\nTo change it, use: \`/setname YourName\``, {
    parse_mode: 'Markdown'
  });
});

// Function to check for overdue tasks and send reminders
function checkOverdueTasks() {
  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  
  taskMessages.forEach((taskInfo, messageId) => {
    // Only send reminder for pending tasks
    if (taskInfo.status !== 'pending') return;
    
    // Check if 24 hours have passed
    const timeSinceCreation = now - taskInfo.createdAt;
    
    if (timeSinceCreation >= twentyFourHours && !taskInfo.reminderSent) {
      // Send reminder message
      const reminderText = `
⏰ *TASK REMINDER*

Hey ${taskInfo.assignee}! This task has been pending for 24 hours:

*Task:* ${taskInfo.taskType}
*Client:* ${taskInfo.client}
*Deadline:* ${taskInfo.deadline}
*Assigned by:* ${taskInfo.assignedBy}

Please update the status! 🙏
      `;
      
      bot.sendMessage(taskInfo.chatId, reminderText, { 
        parse_mode: 'Markdown',
        reply_to_message_id: messageId
      }).catch(err => console.error('Error sending reminder:', err));
      
      // Mark reminder as sent
      taskInfo.reminderSent = true;
    }
  });
}

// Check for overdue tasks every hour
setInterval(checkOverdueTasks, 60 * 60 * 1000); // Check every hour

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
    const assignedBy = getDisplayName(msg.from);
    
    // Format the task message
    const taskMessage = `
📋 *NEW TASK*

*Task:* ${taskType}
*Client:* ${client}
*Deadline:* ${deadline}
*Assigned to:* ${assignee}
*Assigned by:* ${assignedBy}

*Status:* ⏳ Pending
    `;
    
    // Delete the original message first
    bot.deleteMessage(chatId, msg.message_id)
      .then(() => {
        // Then send formatted task message with inline buttons
        return bot.sendMessage(chatId, taskMessage, { 
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '👍 Complete', callback_data: `complete_${Date.now()}` },
              { text: '👎 Cancel', callback_data: `cancel_${Date.now()}` }
            ]]
          }
        });
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
          status: 'pending',
          createdAt: Date.now(),
          reminderSent: false
        });
      })
      .catch(err => {
        console.error('Error:', err);
        // If deletion fails, still send the formatted message
        bot.sendMessage(chatId, taskMessage, { 
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '👍 Complete', callback_data: `complete_${Date.now()}` },
              { text: '👎 Cancel', callback_data: `cancel_${Date.now()}` }
            ]]
          }
        });
      });
  }
});

// Listen for button clicks
bot.on('callback_query', (query) => {
  const messageId = query.message.message_id;
  const taskInfo = taskMessages.get(messageId);
  
  if (!taskInfo) {
    bot.answerCallbackQuery(query.id, { text: 'Task not found!' });
    return;
  }
  
  let newStatus = '';
  let statusEmoji = '';
  
  if (query.data.startsWith('complete_')) {
    newStatus = 'completed';
    statusEmoji = '👍';
  } else if (query.data.startsWith('cancel_')) {
    newStatus = 'cancelled';
    statusEmoji = '👎';
  }
  
  if (newStatus) {
    taskInfo.status = newStatus;
    
    const updatedBy = getDisplayName(query.from);
    
    const updatedMessage = `
📋 *TASK ${newStatus.toUpperCase()}*

*Task:* ${taskInfo.taskType}
*Client:* ${taskInfo.client}
*Deadline:* ${taskInfo.deadline}
*Assigned to:* ${taskInfo.assignee}
*Assigned by:* ${taskInfo.assignedBy}

*Status:* ${statusEmoji} ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}

_Updated by ${updatedBy}_
    `;
    
    bot.editMessageText(updatedMessage, {
      chat_id: taskInfo.chatId,
      message_id: messageId,
      parse_mode: 'Markdown'
    }).catch(err => console.error('Error updating message:', err));
    
    bot.answerCallbackQuery(query.id, { text: `Task marked as ${newStatus}! ${statusEmoji}` });
  }
});

// Command to show help
bot.onText(/\/start/, (msg) => {
  const helpText = `
🤖 *Agency Task Bot*

*How to create tasks:*
Send a task in this format:
\`Task Type | Client | Deadline | @assignee\`

*Example:*
\`Editing | ABC Corp | 2025-10-05 | @john\`

The bot will delete your message and format it nicely. Click the buttons to mark complete or cancel.

*Set your display name:*
\`/setname Your Name\` - Set your preferred name
\`/myname\` - Check your current name

*Features:*
• Auto-formats tasks
• 24-hour reminders for pending tasks
• Track who assigned and completed tasks
• Custom display names

*Note:* Bot needs admin permissions to delete messages!
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
