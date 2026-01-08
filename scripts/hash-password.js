const bcrypt = require("bcryptjs");

const password = process.argv[2];
if (!password) {
  // eslint-disable-next-line no-console
  console.error("Usage: npm run hash:password -- \"your-password\"");
  process.exit(1);
}

const saltRounds = 12;
bcrypt.hash(password, saltRounds).then((hash) => {
  // eslint-disable-next-line no-console
  console.log(hash);
});

