//importing modules
const express = require('express');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sequelize = require('sequelize')
const dotenv = require('dotenv').config()
const cookieParser = require('cookie-parser')
const multer = require('multer')
const path = require('path');
const fs = require('fs');

const pool = require('./db');

const loginRouter = require('./Routes/loginRouter');
const fileUploadRouter = require('./Routes/uploadRouter');
const fileDownloadRouter = require('./Routes/uploadRouter');
const registerRouter = require('./Routes/registerRouter')



/////////
const {authenticateToken} = require('./Middlewares/tokenAuthenticateMiddleware')

const PORT = process.env.PORT 

const app = express()

//middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

const initDatabase = async () => {
    try {
        const userTableSql = fs.readFileSync(path.join(__dirname, 'initDB.sql'), 'utf8');
        await pool.query(userTableSql);

        console.log("Database initialized successfully.");
    } catch (err) {
        console.error("Error initializing database:", err);
    }
};

pool.query("SELECT 1")
    .then(async () => {
        console.log('db connection successful');
        await initDatabase();
        app.listen(PORT,
            () => console.log(`Server is connected on ${PORT}`))
    })
    .catch(err=>console.log('db connection failed. \n'+err))

// app.use("/register", registerRouter);
// app.use("/login", loginRouter);
// app.use("/upload", fileUploadRouter);
// app.use("/download", fileDownloadRouter);


app.post("/register",async(req,res)=>{
    try{
        const {username,password,name}=req.body; //req body format
        const hashedPass= await bcrypt.hash(password,10);

        const result = await pool.query(
            'INSERT INTO "user" (user_id, password, name) VALUES ($1, $2, $3) RETURNING *',
            [username,hashedPass,name]
        );
        res.status(200).json(result.rows[0]);
    } catch(err){
        console.error(err.message);
        res.status(500).send("Server Error");
    }
})

app.post("/login", async (req,res)=>{
    try {
        const {username, password} = req.body;

        const result = await pool.query('SELECT * FROM "user" WHERE user_id = $1',[username]);

        const user = result.rows[0];
        if(!user){
            return res.status(400).json({message:"No Such User Exists"});
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if(!isPasswordMatch){
            return res.status(400).json({message: "Invalid Password"});
        } else{
            const token = jwt.sign(
                { userId: user.user_id },
                process.env.JWT_SECRET,
                { expiresIn: '1h' } 
            );
            
            res.cookie('token', token, { httpOnly: true });
            return res.status(200).json({message: "Successful login",token:token});
        }

        // const token = jwt.sign
    } catch(err){
        console.error(err.message);
        res.status(500).send("Server Error");
    }
})

app.get('/dashboard', authenticateToken, (req, res) => {
    res.status(200).json({ message: "Welcome to the Dashboard", user: req.user });
});

const storage = multer.memoryStorage({
    filename: (req,file,cb) =>{
        const fileExt = path.extname(file.originalname);
        const fileName = file.originalname
                            .replace(fileExt,"")
                            .toLowerCase()
                            .split(" ")
                            .join("-")+"-"+Date.now();
        cb(null,fileName+fileExt);
    }
})

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } 
});

app.post('/upload', authenticateToken, upload.single('attachment'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    try {
        const { name, user_id } = req.body;
        const attachment = req.file.buffer; // Get the file buffer from multer
        const createdAt = new Date().toISOString();
        const query = 'INSERT INTO resources_details (name, user_id, created_at, attachment) VALUES ($1, $2, $3, $4) RETURNING *';
        const values = [name, user_id, createdAt, attachment];

        const result = await pool.query(query, values);
        const temp = await pool.query("SELECT * FROM resources_details");
        console.log(temp.rows)

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

app.get('/download/:resourceId', authenticateToken, async (req, res) => {
    try {
        const { resourceId } = req.params;
        const query = 'SELECT name, attachment FROM resources_details WHERE resource_id = $1';
        const result = await pool.query(query, [resourceId]);
        if (result.rows.length > 0) {
            const file = result.rows[0];
            const fileName = file.name;
            const fileData = file.attachment;
            console.log(file)
            res.writeHead(200, {
                'Content-Type': "application/pdf",
                'Content-Disposition': `attachment; filename="vim_demo.pdf"`
              });
            res.end(Buffer.from(fileData, 'binary'));
        } else {
            res.status(404).send('File not found');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


