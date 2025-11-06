import 'dotenv/config';

const applicationId = process.env.APPLICATION_ID;

if (!applicationId) {
  console.error('APPLICATION_ID is not set in .env file');
  process.exit(1);
}

// Botに必要な権限のビットフラグ
// Send Messages (2048) + Mention Everyone (131072) + Use Slash Commands (8)
const permissions = 2048 | 131072 | 8;

const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${applicationId}&permissions=${permissions}&scope=bot%20applications.commands`;

console.log('📋 Botをサーバーに招待するURL:');
console.log('');
console.log(inviteUrl);
console.log('');
console.log('このURLをブラウザで開いて、Botをサーバーに招待してください。');
console.log('招待後、もう一度 `npm run register` を実行してください。');

