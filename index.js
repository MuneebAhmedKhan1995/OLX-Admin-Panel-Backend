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
//   origin:['https://olx-admin-panel-frontend.vercel.app' || 'http://localhost:5173'], 
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

// CORS FIX - Array use karo, || nahi
app.use(cors({
  origin: [
    'https://olx-admin-panel-frontend.vercel.app',
    'http://localhost:5173'
  ], 
  credentials: true,
  exposedHeaders: ['set-cookie']
}))

const port = process.env.PORT || 3002
app.use(express.json());
app.use(cookieParser())

// Auth routes (without token check)
app.use(authRoutes) 

// Middleware FIX - Only signIn/signUp skip karo
const authenticateToken = (req, res, next) => {
  try{
    // ONLY signIn aur signUp ko skip karo, auth/me ko nahi
    if (req.path === '/signIn' || req.path === '/signUp') {
      return next();
    }
    
    // Auth/me ko bhi protect karo
    const token = req.cookies?.token;
    
    if (!token) {
      return res.status(401).json({
        status: 0,
        message: "No token provided"
      });
    }
    
    let decoded = jwt.verify(token, process.env.SECRET);
    req.user = decoded; // User info store karo
    next();
  } catch(error){
    return res.status(401).json({
      status: 0,
      message: "Invalid Token"
    });
  }
}

app.use(authenticateToken)

// Protected routes (require token)
app.use(productRoutes)
app.use(categoryRoutes) 

app.listen(port, () => {
  console.log(`Example app listening on port ${ port }`)
})






