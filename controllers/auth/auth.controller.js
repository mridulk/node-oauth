const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const querystring =require('querystring')
const jwt =require('jsonwebtoken')
const axios = require('axios')
const {get} = require('lodash')
const {JWT_SECRET,GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,COOKIE_NAME,SERVER_ROOT_URI,GITHUB_CLIENT_ID,GITHUB_CLIENT_SECRET}=process.env;

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
    return res.send(getGoogleAuthURL());
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
    //front end url here 
    res.redirect(`${SERVER_ROOT_URI}/auth/me`);
  });

//fetching user profile data
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
  

  // Github Implementation  (getting token from query code)
  async function getGitHubUser({ code }) {
    const githubToken = await axios
      .post(
        `https://github.com/login/oauth/access_token?client_id=${GITHUB_CLIENT_ID}&client_secret=${GITHUB_CLIENT_SECRET}&code=${code}`
      )
      .then((res) => res.data)
  
      .catch((error) => {
        throw error;
      });

    const decoded = querystring.parse(githubToken);
  
    const accessToken = decoded.access_token;
  
    return axios
      .get("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((res) => res.data)
      .catch((error) => {
        console.error(`Error getting user from GitHub`);
        throw error;
      });
  }
  //Redirect uri : https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${gitHubRedirectURL}?path=${path}&scope=user:email
  //https://github.com/login/oauth/authorize?client_id=5b0c4b7f43c5f8a56e47&redirect_uri=http://localhost:3000/auth/github?path=/&scope=user:email

  router.get("/github", async (req, res) => {
    const code = get(req, "query.code");
    const path = get(req, "query.path", "/");
  
    if (!code) {
      throw new Error("No code!");
    }
    
    
    const gitHubUser = await getGitHubUser({ code });
  
    const token = jwt.sign(gitHubUser, JWT_SECRET);
  
    res.cookie(COOKIE_NAME, token, {
      maxAge: 900000,
      httpOnly: true,
      secure: false,
    });
    res.send("User Logged In")
    //frontend url here
    res.redirect(`http://localhost:4000/me`);
  });

  
module.exports = router;
