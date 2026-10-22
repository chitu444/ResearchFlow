import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  equipment:{type:mongoose.Schema.Types.ObjectId,ref:'Equipment',required:true,unique:true},
  owner:{type:String,required:true},
  lockedUntil:{type:Date,required:true}
},{timestamps:true});
schema.index({lockedUntil:1});
export default mongoose.model('BookingLock',schema);
