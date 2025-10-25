import express from 'express'
import { client } from '../dbConfig.js';
import { ObjectId } from 'mongodb';
const router = express.Router()
const myDB = client.db("OLX");
const Category = myDB.collection("categorys");
import jwt from 'jsonwebtoken'


router.post('/category', async (req, res) => {
  let decoded = jwt.verify(req.cookies.token, process.env.SECRET);
  const category = {
    name: req.body.name,
    createdAt: Date.now(),
  }

  const response = await Category.insertOne(category)
  if (response) {
    return res.send("Category added successfully")
  }
  else {
    return res.send("something went wrong")
  }
})

router.get('/categorys', async (req, res) => {
  const allCategorys = Category.find()
  const response = await allCategorys.toArray()
  if (response.length > 0) {
    return res.send(response)

  } else {

    return res.send('No category found')
  }
})

// router.delete('/category/:id',async (req, res) => {
//     const categoryId = new ObjectId(req.params.id)
//     const deleteCategory = await Category.deleteOne({ _id: categoryId })
//     if (deleteCategory) {
//         return res.send("Category Deleted Successfully!")
//     }
//     else {
//         return res.send("Something Went Wrong! Please Try Again.")
//     }
// })
// ✅ درست - JSON object return کریں
router.delete('/category/:id', async (req, res) => {
    try {
        const categoryId = new ObjectId(req.params.id);
        console.log('Deleting category with ID:', categoryId);
        
        const deleteResult = await Category.deleteOne({ _id: categoryId });
        console.log('Delete result:', deleteResult);
        
        if (deleteResult.deletedCount === 1) {
            return res.json({
                success: true,
                message: "Category Deleted Successfully!",
                deletedCount: deleteResult.deletedCount,
                deletedId: req.params.id // ✅ ID frontend کو واپس بھیجیں
            });
        } else {
            return res.status(404).json({
                success: false,
                message: "Category not found or already deleted"
            });
        }
    } catch (error) {
        console.error('Delete category error:', error);
        return res.status(500).json({
            success: false,
            message: "Something Went Wrong! Please Try Again.",
            error: error.message
        });
    }
});

router.put('/category/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name} = req.body;

    // ✅ Validate required fields if title/price are being updated
    if (name !== undefined && !name) {
      return res.status(400).json({ message: "Product name cannot be empty" });
    }

    // ✅ Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    // ✅ Build updateData with ONLY provided fields
    const updateData = {
      updatedAt: Date.now() // Always update timestamp
    };

    // ✅ Only add fields that are provided in request body
    if (name!== undefined) updateData.name = name;

    // ✅ Check if any fields to update (besides updatedAt)
    const fieldsToUpdate = Object.keys(updateData).filter(key => key !== 'updatedAt');
    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    const resultUpdated = await Category.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (resultUpdated.matchedCount > 0) {
      const updatedProduct = await Category.findOne({ _id: new ObjectId(id) });
      return res.status(200).json({
        message: "Category updated successfully",
        product: updatedProduct
      });
    } else {
      return res.status(404).json({ message: "Category not found" });
    }
  } catch (error) {
    console.error("Update error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;