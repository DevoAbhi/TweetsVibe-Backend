import mongoose from "mongoose";
const Schema = mongoose.Schema;

const SearchSchema = new Schema({
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        searchWord: {
          type: String,
          required: true,
        },
        dailySentiments: [
          {
            date: {
              type: Date,
              required: true,
            },
            sentiment: {
              positive: {
                type: Number,
                default: 0,
              },
              neutral: {
                type: Number,
                default: 0,
              },
              negative: {
                type: Number,
                default: 0,
              },
            },
          }
        ]
},
    { timestamps: true }
)


export default mongoose.model('Search', SearchSchema);