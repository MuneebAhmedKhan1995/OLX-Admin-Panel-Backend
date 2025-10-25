// import express from 'express'
// import authRoutes from './routes/authRoutes.js'
// import productRoutes from './routes/productRoutes.js'
// import categoryRoutes from './routes/categoryRoutes.js'
// import { client } from './dbConfig.js';
// import cookieParser  from 'cookie-parser'
// import dotenv from 'dotenv'
// import jwt from 'jsonwebtoken'
// import cors from 'cors'

// dotenv.config();
// client.connect();
// console.log("You successfully connected to MongoDB!");

// const app = express()
// app.use(cors({
//   origin: 'https://olx-admin-panel-frontend.vercel.app', 
//   credentials: true
// }))
// const port = process.env.PORT || 3002
// app.use(express.json());
// app.use(cookieParser())

// // Auth routes (without token check)
// app.use(authRoutes) 

// // Middleware for authenticated routes only
// const authenticateToken = (req, res, next) => {
//   try{
//     // Skip token check for auth routes
//     if (req.path.startsWith('/auth') || req.path === '/signIn' || req.path === '/signUp') {
//       return next();
//     }
    
//     let decoded = jwt.verify(req.cookies.token, process.env.SECRET);
//     next()
//   }catch(error){
//     return res.send({
//       status : 0,
//       error : error,
//       message : "Invalid Token"
//     })
//   }
// }

// app.use(authenticateToken)

// // Protected routes (require token)
// app.use(productRoutes)
// app.use(categoryRoutes) 

// app.listen(port, () => {
//   console.log(`Example app listening on port ${ port }`)
// })




import express from 'express'
import authRoutes from './routes/authRoutes.js'
import productRoutes from './routes/productRoutes.js'
import categoryRoutes from './routes/categoryRoutes.js'
import { client } from './dbConfig.js';
import cookieParser  from 'cookie-parser'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import cors from 'cors'

dotenv.config();
client.connect();
console.log("You successfully connected to MongoDB!");

const app = express()
app.use(cors({
  origin: 'https://olx-admin-panel-frontend.vercel.app', 
  credentials: true
}))
const port = process.env.PORT || 3002
app.use(express.json());
app.use(cookieParser())

// Public routes (without token check)
app.use(authRoutes) 

// Middleware for authenticated routes
const authenticateToken = (req, res, next) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({
        status: 0,
        message: "No token provided"
      });
    }
    
    const decoded = jwt.verify(token, process.env.SECRET);
    req.user = decoded; // User info request mein add karo
    next();
  } catch(error) {
    return res.status(401).json({
      status: 0,
      message: "Invalid token"
    });
  }
}

// Auth/me route ko protect karo - YEH IMPORTANT HAI
app.get('/auth/me', authenticateToken, (req, res) => {
  // Ab req.user mein decoded token data hai
  res.json({
    status: 1,
    data: req.user // Ya database se user data fetch karo
  });
});

// Protected routes (require token)
app.use(authenticateToken); // Ya individual routes pe lagao
app.use(productRoutes)
app.use(categoryRoutes) 

app.listen(port, () => {
  console.log(`Example app listening on port ${ port }`)
})