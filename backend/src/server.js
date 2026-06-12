require("dotenv").config();
const app = require("./app");

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Video AI CRM API đang chạy tại http://localhost:${PORT}`);
});
