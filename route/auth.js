const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const jwt =require('jsonwebtoken')
const axios = require('axios')

const {JWT_SECRET,GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,COOKIE_NAME,SERVER_ROOT_URI}=process.env;

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  `${SERVER_ROOT_URI}/auth/google`
);


function getGoogleAuthURL() {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes, // If you only need one scope you can pass it as string
  });
}

//Login Url (google)

router.get('/google/url', (req, res) => {
    res.redirect(getGoogleAuthURL())
//   return res.send(getGoogleAuthURL());
});


//Access token from  user profile
router.get('/google', async (req, res) => {
    const code = req.query.code.toString();

    const { tokens } = await oauth2Client.getToken(code);

    // Fetch the user's profile with the access token and bearer
    const googleUser = await axios
      .get(
        `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${tokens.access_token}`,
        {
          headers: {
            Authorization: `Bearer ${tokens.id_token}`,
          },
        },
      )
      .then(res => res.data)
      .catch(error => {
          console.log("errors")
          console.log(error)
        throw new Error(error.message);
      });
    
    const token = jwt.sign(googleUser, JWT_SECRET);
    console.log("Token Here")
    console.log(token)
    res.cookie(COOKIE_NAME, token, {
      maxAge: 900000,
      httpOnly: true,
      secure: false,
    });
  
    res.redirect(`${SERVER_ROOT_URI}/auth/me`);
  });

  router.get('/me',(req,res)=>{
    try {
        console.log("cookie")
        console.log(req.cookies[COOKIE_NAME])
        const decoded = jwt.verify(req.cookies[COOKIE_NAME], JWT_SECRET);
        console.log("decoded", decoded);
         res.send(decoded);
      } catch (err) {
        console.log(err);
        res.send(null);
      }
  })
  


module.exports = router;
