const express = require("express");
const cors = require("cors");
const oracledb = require("oracledb");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public"))); 

const expiryDate = new Date(expiry);
const today = new Date();
today.setHours(0,0,0,0);

if (expiryDate <= today) {
  return res.json({
    success: false,
    message: "Expired or today's date not allowed"
  });
}



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
      `INSERT INTO USERS (NAME, EMAIL, PASSWORD) VALUES (:1, :2, :3)`,
      [name, email, password],
      { autoCommit: true }
    );
    await conn.close();
    res.json({ success: true, message: "Signup successful!" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Signup failed" });
  }
});


app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const conn = await connectDB();
    const result = await conn.execute(
      `SELECT NAME FROM USERS WHERE EMAIL=:1 AND PASSWORD=:2`,
      [email, password]
    );
    await conn.close();

    if (result.rows.length > 0) {
      res.json({ success: true, name: result.rows[0][0] });
    } else {
      res.json({ success: false });
    }
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});


app.post("/addPrescription", async (req, res) => {
  const { patientId, medicine, dosage, days, time } = req.body;

  try {
    const conn = await connectDB();
    await conn.execute(
      `INSERT INTO PRESCRIPTIONS
       (PATIENT_ID, MEDICINE, DOSAGE, DAYS, TIME, STATUS)
       VALUES (:1, :2, :3, :4, :5, 'ACTIVE')`,
      [patientId, medicine, dosage, days, time],
      { autoCommit: true }
    );
    await conn.close();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});


app.post("/setReminder", async (req, res) => {
  const { patientId, medicine, time, days } = req.body;

  try {
    const conn = await connectDB();
    await conn.execute(
      `INSERT INTO REMINDERS
       (PATIENT_ID, MEDICINE, TIME, DAYS_LEFT, STATUS)
       VALUES (:1, :2, :3, :4, 'ACTIVE')`,
      [patientId, medicine, time, days],
      { autoCommit: true }
    );
    await conn.close();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});


app.post("/takeMedicine", async (req, res) => {
  const { reminderId } = req.body;

  try {
    const conn = await connectDB();

    await conn.execute(
      `UPDATE REMINDERS
       SET DAYS_LEFT = DAYS_LEFT - 1
       WHERE ID = :1`,
      [reminderId]
    );

    await conn.execute(
      `UPDATE REMINDERS
       SET STATUS = 'COMPLETED'
       WHERE DAYS_LEFT <= 0`,
      [],
      { autoCommit: true }
    );

    await conn.close();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

app.post("/updatePastPrescriptions", async (req, res) => {
  const { patientId } = req.body;

  try {
    const conn = await connectDB();
    await conn.execute(
      `UPDATE PRESCRIPTIONS
       SET STATUS = 'PAST'
       WHERE PATIENT_ID = :1
       AND MEDICINE IN (
         SELECT MEDICINE FROM REMINDERS WHERE STATUS='COMPLETED'
       )`,
      [patientId],
      { autoCommit: true }
    );
    await conn.close();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});


app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});


app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
