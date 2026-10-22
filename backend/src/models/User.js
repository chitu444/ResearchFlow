import mongoose from 'mongoose';
const schema=new mongoose.Schema({name:{type:String,required:true,trim:true},email:{type:String,required:true,unique:true,lowercase:true,trim:true},password:{type:String,required:true},role:{type:String,enum:['researcher','lab_manager','institution_admin'],default:'researcher'},department:{type:mongoose.Schema.Types.ObjectId,ref:'Department'},laboratory:{type:mongoose.Schema.Types.ObjectId,ref:'Laboratory'},active:{type:Boolean,default:true},lastLogin:Date},{timestamps:true});
export default mongoose.model('User',schema);
