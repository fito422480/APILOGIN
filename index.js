const express = require("express");
const bodyParser = require("body-parser");
const { MongoClient, ServerApiVersion } = require("mongodb");
const bcrypt = require("bcrypt");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const url = process.env.MONGODB_URI;
const PORT = process.env.PORT || 9090;

const client = new MongoClient(url, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function initializeMongoDB() {
  try {
    await client.connect();
    await client.db("INVOICE").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
}

async function startServer() {
  try {
    await app.listen(PORT);
    console.log(`Web service running on port ${PORT}`);
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
}

initializeMongoDB()
  .then(startServer)
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });

const db = client.db("INVOICE");
const userCollection = db.collection("user");

app.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Se requiere correo electrónico y contraseña!" });
    }

    const existingUser = await userCollection.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ error: "El usuario ya existe!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await userCollection.insertOne({ email, password: hashedPassword });

    res.json({ message: "Usuario registrado correctamente!" });
  } catch (error) {
    console.error("Error durante el registro:", error);
    res.status(500).json({ error: "Error interno en el servidor" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Se requiere correo electrónico y contraseña!" });
    }

    const user = await userCollection.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado!" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Contraseña incorrecta!" });
    }

    res.json({ message: "Inicio de sesión exitoso!" });
  } catch (error) {
    console.error("Error durante el inicio de sesión:", error);
    res.status(500).json({ error: "Error interno en el servidor" });
  }
});

// Manejo de errores centralizado
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Error interno en el servidor" });
});
