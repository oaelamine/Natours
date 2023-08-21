const crypto = require('crypto');
const mongouse = require('mongoose');
// eslint-disable-next-line import/no-extraneous-dependencies
const bcrypt = require('bcryptjs');
const { default: isEmail } = require('validator/lib/isEmail');

const userSchema = new mongouse.Schema({
  name: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    maxlength: [30, "Username can't bee more then 30 chars"],
    minlength: [5, "Username can't bee less the 5 chars"]
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [isEmail, 'Please provide a valide email']
  },
  photo: {
    type: String
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Password confirm is required'],
    validate: {
      //This only work on save() and create()
      validator: function(el) {
        return el === this.password;
      },
      message: 'The passwordConfirm dose not match the password'
    }
  },
  passwordChangedAt: Date,
  role: {
    type: String,
    enum: {
      values: ['admin', 'user', 'guide', 'lead-guide'],
      message: 'This role do note exists'
    },
    default: 'user'
  },
  passwordResetToken: String,
  passwordResetTokenExpier: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

//MIDDELWEARS
//ENCRYPTION
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  //hache the password
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;

  next();
});

//step 3 of the resetPassword function
userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

//QUERY MIDDELWRAE
//select only active users
userSchema.pre(/^find/, function(next) {
  //$ne = not equale
  this.find({ active: { $ne: false } });
  next();
});
// FUNCTION COPARE THE PASSWORD PROVIDED BY
// THE USER AND THE ONE IN THE DB
// THIS IS A INSTENCE METHEODE
// ITS AVILABLE ON ALL USER DOCUMENT
// CHESK authController.login for more info
userSchema.methods.correctPassword = async function(
  condidatePassword,
  userPasswoed
) {
  return await bcrypt.compare(condidatePassword, userPasswoed);
};

//function to chesk if the user hase change his password
userSchema.methods.checkPasswordUpdated = function(JWTTimeStamp) {
  if (this.passwordChangedAt) {
    //convert the value of the date to secends
    const convertedTime = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

    //if the password hase ben chagen after its creation we return true
    return JWTTimeStamp < convertedTime;
  }
  //false mean the password hase not ben changed
  return false;
};

//function to generate a random toekn
userSchema.methods.createPasswordResetToken = function() {
  // 1) generate a random token using core lib crypto
  const randomToken = crypto.randomBytes(32).toString('hex');
  // 2) haching the token and saveit in the database
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(randomToken)
    .digest('hex');
  // 3) spessifing a expirong time for the token
  this.passwordResetTokenExpier = Date.now() + 10 * 60 * 1000;
  //4) returning the plane text token so we can send it to the user via email
  return randomToken;
};

const User = mongouse.model('User', userSchema);

module.exports = User;
