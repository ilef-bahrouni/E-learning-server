import mongoose from "mongoose"
export const connectDB = async () => {
    mongoose.set('strictQuery', true);
    // const { connection } = await mongoose.connect(process.env.MONGO_URI)
    // console.log(`MongoDB Connected with ${connection.host} `)
     const uri ='mongodb+srv://ilefbahrouni2002:7E26JfLrfKodTAWQ@cluster0.cpdxn.mongodb.net/test?retryWrites=true&w=majority'
     mongoose.set('strictQuery', true);
    mongoose.connect(uri  
    // mongoose.connect('mongodb://127.0.0.1:27017/e-learning'
        , {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000 
            })
        .then(() => {
            console.log('MongoDB connection successful');
        }).catch((err) => {
            console.error('MongoDB connection error:', err);
            process.exit(1) ; 
        })
}