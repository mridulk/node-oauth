const express=require('express')
const router=express.Router();

router.get('/',(req,res)=>{
    res.send("Home Page")
})
router.get('/me',(req,res)=>{
    res.send("User Loggged In")
})
module.exports=router;