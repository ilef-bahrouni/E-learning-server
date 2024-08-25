import mongoose from "mongoose"
export const connectDB = async () => {
    mongoose.set('strictQuery', true);
    // const { connection } = await mongoose.connect(process.env.MONGO_URI)
    // console.log(`MongoDB Connected with ${connection.host} `)
    mongoose.connect('mongodb+srv://ilefbahrouni2002:hJ6M8YsOfXmRtOji@cluster0.4gqzj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
    // mongoose.connect('mongodb://127.0.0.1:27017/e-learning'
        , {// useNewUrlParser: true , 
           // useNewUrlParser: true,
           // useUnifiedTopology: true,
           // useCreateIndex: true,
           // useFindAndModify: false,
            })
        .then(() => {
            console.log('mongo connected')
        }).catch((err) => {
            console.log(err);
        })
}