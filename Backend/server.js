const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

if (!process.env.SESSION_SECRET) {
  throw new Error('Falta configurar SESSION_SECRET en el archivo .env');
}

const app = require('./src/app');
const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`ClickMarket API: http://localhost:${port}`));
