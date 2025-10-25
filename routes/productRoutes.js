import express from 'express'
import { client } from '../dbConfig.js';
import { ObjectId } from 'mongodb';
const router = express.Router()
const myDB = client.db("OLX");
const Products = myDB.collection("products");
import jwt from 'jsonwebtoken'
import { upload } from '../midleware/Multer.js';
import cloudinary from '../midleware/cloudinary.js'

// router.post('/user/product', async (req, res) => {
//   let decoded = jwt.verify(req.cookies.token, process.env.SECRET);

//   console.log(req.body)
//   const product = {
//     title: req.body.title,
//     description: req.body.description,
//     price: req.body.price,
//     category: req.body.category,
//     quantity: req.body.quantity || 0,
//     postedBy: decoded._id,
//     image: req.body.image,
//     status: true,
//     deletedAt: null,
//     isDeleted: false,
//     productType: req.body.productType,
//     createdAt: Date.now(),
//     updatedAt: Date.now(),
//   }

//   const response = await Products.insertOne(product)
//   if (response) {
//     return res.send("product added successfully")
//   }
//   else {
//     return res.send("something went wrong")
//   }
// })

// ✅ Existing route ko update karo FormData handle karne ke liye
router.post('/user/product', upload.array('image', 5), async (req, res) => {
  try {
    let decoded = jwt.verify(req.cookies.token, process.env.SECRET);
    
    console.log("Request Body:", req.body);
    console.log("Uploaded Files:", req.files);

    // ✅ Cloudinary upload agar files hain
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (let file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "products"
        });
        imageUrls.push(result.secure_url);
      }
    }

    const product = {
      title: req.body.title,
      description: req.body.description,
      price: parseFloat(req.body.price),
      category: req.body.category,
      quantity: parseInt(req.body.quantity) || 0,
      postedBy: decoded._id,
      images: imageUrls.length > 0 ? imageUrls : [req.body.image], // ✅ Multiple images support
      status: true,
      deletedAt: null,
      isDeleted: false,
      productType: req.body.productType,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    console.log("Product to insert:", product);

    const response = await Products.insertOne(product);
    if (response.acknowledged) {
      return res.status(200).json({
        status: 1,
        message: "Product added successfully",
        productId: response.insertedId
      });
    } else {
      return res.status(500).json({
        status: 0,
        message: "Something went wrong"
      });
    }
  } catch (error) {
    console.error("Product creation error:", error);
    return res.status(500).json({
      status: 0,
      message: "Internal server error"
    });
  }
});
router.get('/user/products', async (req, res) => {
  const allProducts = Products.find({ status: true, isDeleted: false, deletedAt: null })
  const response = await allProducts.toArray()
  console.log(response)
  if (response.length > 0) {
    return res.send(response)

  } else {

    return res.send('No products found')
  }
})

router.delete('/user/products/:id',async (req, res) => {
    const productId = new ObjectId(req.params.id)
    const deleteProduct = await Products.deleteOne({ _id: productId })
    if (deleteProduct) {
        return res.send("Product Deleted Successfully!")
    }
    else {
        return res.send("Something Went Wrong! Please Try Again.")
    }
})

router.put('/user/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, price, image, description, quantity, productType } = req.body;

    // ✅ Validate required fields if title/price are being updated
    if (title !== undefined && !title) {
      return res.status(400).json({ message: "Product name cannot be empty" });
    }
    if (price !== undefined && (!price || isNaN(parseFloat(price)))) {
      return res.status(400).json({ message: "Valid price is required" });
    }

    // ✅ Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    // ✅ Build updateData with ONLY provided fields
    const updateData = {
      updatedAt: Date.now() // Always update timestamp
    };

    // ✅ Only add fields that are provided in request body
    if (title !== undefined) updateData.title = title;
    if (category !== undefined) updateData.category = category;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (image !== undefined) updateData.image = image;
    if (description !== undefined) updateData.description = description;
    if (quantity !== undefined) updateData.quantity = parseInt(quantity);
    if (productType !== undefined) updateData.productType = productType;

    // ✅ Check if any fields to update (besides updatedAt)
    const fieldsToUpdate = Object.keys(updateData).filter(key => key !== 'updatedAt');
    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    const resultUpdated = await Products.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (resultUpdated.matchedCount > 0) {
      const updatedProduct = await Products.findOne({ _id: new ObjectId(id) });
      return res.status(200).json({
        message: "Product updated successfully",
        product: updatedProduct
      });
    } else {
      return res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.error("Update error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// router.post('/uploadFile', upload.single('productPhoto'), async function (req, res) {
// router.post('/user/uploadImage', upload.array('productPhoto', 5), async (req, res) => {
//     try {
//         // Check if file exists
//         if (!req.file) {
//             return res.status(400).send({
//                 error: 'No file uploaded'
//             });
//         }

//         console.log(req.file, req.body);

//         // Upload to Cloudinary
//         const result = await cloudinary.uploader.upload(req.file.path, {
//             folder: "products"
//         });

//         console.log('Cloudinary upload successful:', result);

//         // Send ONLY ONE response
//         return res.status(200).send({
//             message: 'File uploaded successfully',
//             file: req.file,
//             body: req.body,
//             result: result
//         });

//     } catch (error) {
//         console.error('Upload error:', error);
        
//         // Send ONLY ONE error response
//         return res.status(500).send({
//             error: 'File upload failed',
//             message: error.message
//         });
//     }
// });

export default router;

// router.get('/user/myProducts', async (req, res) => {
//   let decoded = jwt.verify(req.cookies.token, process.env.SECRET);
//   const allProducts = Products.find({ postedBy: decoded._id, isDeleted: false, deletedAt: null })
//   const response = await allProducts.toArray()
//   console.log(response)
//   if (response.length > 0) {
//     return res.send(response)

//   } else {

//     return res.send('No products found')
//   }
// })

// router.post('/user/product/:id', async (req, res) => {
//   try {
//     const productId = new ObjectId(req.params.id)
//     let decoded = jwt.verify(req.cookies.token, process.env.SECRET);
//     const product = await Products.findOne({ _id: productId, postedBy: decoded._id });
//     if (!product) {
//       return res.status(404).send({
//         status: 0,
//         message: "Product not found"
//       })
//     }
//     const deleteProduct = await Products.updateOne({ _id: productId, postedBy: decoded._id }, { $set: { isDeleted: true, deletedAt: Date.now() } }, {})
//     return res.status(200).send({
//       status: 1,
//       message: "Product Deleted"
//     })
//   } catch (error) {
//     return res.status(500).send({
//       status: 0,
//       error: error,
//       message: "internal server error"
//     })
//   }
// })

// router.put('/user/product/:id', async (req, res) => {
//   // const query = {id : new ObjectId(req.params.id)}
//   // const update = { title: req.body.title, description: req.body.description }
//   const result = await Products.updateOne(
//     { _id: new ObjectId(req.params.id) },
//     { $set: { title: req.body.title, description: req.body.description } },
//     {}
//   )

//   if (result) {
//     return res.send("product updated successfully")
//   } else {
//     return res.send("something went wrong")
//   }
// })

// router.get('/user/product/:id', async (req, res) => {
//   const product = await Products.findOne({ _id: new ObjectId(req.params.id), status: true, isDeleted: false, deletedAt: null })
//   if (product) {
//     return res.send(product)
//   } else {
//     return res.send('product not found')
//   }
// })

// router.post('/user/favourite/:productId', async (req, res) => {
//   try {
//     let decoded = jwt.verify(req.cookies.token, process.env.SECRET);
//     let product = await Products.findOne({ _id: new ObjectId(req.params.productId), status: true, isDeleted: false, deletedAt: null })
//     if (!product) {
//       return res.status(404).send({
//         status: 0,
//         message: "product not found"
//       })
//     }
//     let favourite = await Favourites.insertOne({
//       userId: decoded._id,
//       productId: req.params.productId
//     })
//     return res.status(200).send({
//       status: 1,
//       message: "added to favourite"
//     })
//   } catch (error) {
//     return res.status(500).send({
//       status: 0,
//       error: error,
//       message: "Internal Server Error"
//     })
//   }

// })

// router.get('/user/cart/:userId', (request, res) => {
//   res.send('this is user cart')
// })

// router.post('/user/checkout/:cartId', (request, res) => {
//   res.send('order placed succesfully')
// })

