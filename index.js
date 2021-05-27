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

app.use('/',require('./route/user'))
app.use('/auth',require('./route/auth'))

const PORT=3000||process.env.PORT;

app.listen(PORT,console.log(`Server is on port ${process.env.PORT}`))