const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const oracledb = require("oracledb");
const path = require("path");

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public"))); 

async function connectDB() {
  try {
    return await oracledb.getConnection({
      user: "System",      
      password: "Keerthi", 
      connectString: "localhost/XEPDB1"
    });
  } catch (err) {
    console.error("Oracle DB Connection Error:", err);
    throw err;
  }
}


app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const conn = await connectDB();
    await conn.execute(
      `INSERT INTO USERS (NAME, EMAIL, PASSWORD) VALUES (:n, :e, :p)`,
      [name, email, password],
      { autoCommit: true }
    );
    await conn.close();
    res.json({ success: true, message: "Signup successful!" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Error signing up. Email may exist." });
  }
});


app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const conn = await connectDB();
    const result = await conn.execute(
      `SELECT NAME FROM USERS WHERE EMAIL=:e AND PASSWORD=:p`,
      [email, password]
    );
    await conn.close();

    if (result.rows.length > 0) {
      res.json({ success: true, name: result.rows[0][0] });
    } else {
      res.json({ success: false, message: "Invalid email or password" });
    }
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Server error. Try again later." });
  }
});


app.listen(3000, () => console.log("Server running at http://localhost:3000"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

