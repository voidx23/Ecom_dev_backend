import { Req, Res } from "../../../type/user/express";
import { bcryptFun } from "../../../services/userService/passwordBcrypt";
import { IUser, IUserDb } from "../../../type/user/User";
import UserModel from "../../../models/user/UserModel";
import otpGenerator from "otp-generator";
import { SendEmailOtp } from "../../../services/userService/nodeMailer";
import { Document } from "mongoose";

class UserController {
  public async createUser(req: Req, res: Res): Promise<void | Res> {
    try {
      console.log("inside create user function");
      console.log("Signup controller ❤️❤️❤️❤️❤️❤️");
      const { email, password, phone, address, state, city, pincode } =
        req.body;
      const hashPassword: string = await bcryptFun.hashPassword(password);

      const userData: IUser = {
        email: email,
        phone: phone,
        password: hashPassword,
        address: address,
        state: state,
        city: city,
        pincode: pincode,
      };

      const savedUser: IUserDb = await UserModel.create(userData);

      res.status(200).json({ message: "sucessfully save", data: savedUser });
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error creating user:", err.message);
        return res.status(500).json({ message: err.message });
      } else {
        console.error("Unknown error creating user");
        return res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  }

  public async signInUser(req: Req, res: Res): Promise<void> {
    try {
      const userData: IUserDb | null = await UserModel.findOne({
        email: req.body.email,
      });
      if (userData) {
        if (userData.verified) {
          const match = await bcryptFun.comparePassword(req.body.password, userData.password);


          if (match) {
            res.status(200).json({
              message: "sucessfully login",
              token: req.body.token
            });
          } else {
            res.status(400).json({ message: "Invalid password" });
          }
        } else {
          res.status(400).json({ message: "Please verify your email" });
        }
      } else {
        res.status(404).json({ message: "User does not exist" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  public async sendEmail(req: Req, res: Res): Promise<void> {
    try {
      const OTP: string = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
        digits: true,
      });
      console.log(OTP);
      const SaveData: IUser | null = await UserModel.findOneAndUpdate(
        { email: req.body.email },
        {
          $set: {
            otp: OTP,
          },
        },
        { new: true }
      );

      if (SaveData) {
        const EmailOtpSend: { success: boolean } = await SendEmailOtp(
          req.body.email,
          OTP
        );
        if (EmailOtpSend.success) {
          res.status(200).json({ message: "The email was sent successfully" });
        } else {
          res
            .status(200)
            .json({
              message:
                "There is  an issue on sending email please try again later",
            });
        }
      }
    } catch (error: any) {
      res.status(500).json({ messaage: error.messaage });
    }
  }

  public async verifyOtp(req: Req, res: Res): Promise<void> {
    try {
      const userData: IUserDb | null = await UserModel.findOne({
        email: req.body.email,
      });

      if (userData) {
        if (userData.otp === req.body.otp) {
          userData.verified = true;
          const savedUserData = await (userData as Document).save();

          if (savedUserData) {
            res.status(200).json({ message: "OTP verified successfully" });
          } else {
            res
              .status(500)
              .json({
                message: "There was an issue verifying the OTP in the database",
              });
          }
        } else {
          res.status(400).json({ message: "Invalid OTP" });
        }
      } else {
        res.status(404).json({ message: "User does not exist" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  public async addnewPassword(req: Req, res: Res): Promise<void>{
    try {
      const { password, email}: { password: string; email: string} = req.body;

      const updatedData: IUser | null = await UserModel.findOneAndUpdate({email: email}, {
        $set: {
          password: password
        }
      },{ new: true });


      if(updatedData){
        res.status(200).json({message: "New Password added succsfully", data: updatedData});
      }else{
        res.status(400).json({message: "Password Adding unsucessfull"});
      }
    } catch (error: any) {
      res.status(500).json({ messaage: error.messaage });
    }
  }

}
export default UserController;
