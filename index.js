const express=require('express')
const dotenv=require('dotenv')
const cors=require('cors')
const cookieparser=require('cookie-parser')

// Load config (enter secret keys , hide from public domain)
dotenv.config({path:'./config/config.env'})


// initializeing app
const app=express();

// enabling cors
app.use(cors({ origin: true, credentials: true }))
app.use(cookieparser())

// Route handlers

app.use('/',require('./controllers/auth/user.controller'))
app.use('/auth',require('./controllers/auth/auth.controller'))

const PORT=3000||process.env.PORT;

app.listen(PORT,console.log(`Server is on port ${process.env.PORT}`))