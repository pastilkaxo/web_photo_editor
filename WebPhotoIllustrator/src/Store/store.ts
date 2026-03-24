import {IUser} from "../models/IUser";
import {makeAutoObservable, observable} from "mobx";
import AuthService from "../Services/AuthService";
import UserService from "../Services/UserService";
import GptService from "../Services/GptService";
import axios from "axios";
import {IAuthResponse} from "../models/response/AuthResponse";
import {API_URL} from "../http";
import {IPassResponse} from "../models/response/PasswordResponse";
import { AxiosResponse } from 'axios';

export default  class Store {
    user = {} as IUser;
    isAuth = false;
    isLoading = false;
    error = "";
    isEditing = false;
    wantToResetPassword = false;
    totalStars = 0;
    isActivated = false;
    
    constructor() {
        makeAutoObservable(this);
    }
    setError(error: string) {
        this.error = error;
    }

    setAuth(isAuth: boolean) {
        this.isAuth = isAuth;
    }

    setTotalStars(totalStars: number) {
        this.totalStars = totalStars;
    }

    setUser(user: IUser) {
        this.user = user;
    }

    setIsActivated(isActivated:boolean) {
        this.isActivated = isActivated;
    }

    setIsLoading(isLoading: boolean) {
        this.isLoading = isLoading;
    }

    setWantToResetPass(wantToResetPassword: boolean) {
        this.wantToResetPassword = wantToResetPassword;
    }

    async generateText(prompt: string): Promise<{ generatedText?: string; error?: string }> { 
        this.setIsLoading(true);
        try {  
            const response = await GptService.generateText(prompt);
            return { generatedText: response.data.generatedText };
        } catch (err: any) {
            this.setError(err.response?.data?.message);
            return { error: err.response?.data?.message || "Unknown error" };
        } finally {
            this.setIsLoading(false);
        }
    }

    async generateImage(prompt: string): Promise<{ imageUrl?: string; error?: string; retryAfter?: number }> {
        this.setIsLoading(true);
        try {
            const response = await GptService.generateImage(prompt);
            return { imageUrl: response.data.imageUrl };
        } catch (err: any) {
            const msg = err.response?.data?.message || "Ошибка при генерации изображения";
            const retryAfter = err.response?.data?.retryAfter;
            this.setError(msg);
            return { error: msg, retryAfter };
        } finally {
            this.setIsLoading(false);
        }
    }

    async requestPasswordReset(email: string): Promise<{ data?: IPassResponse; error?: string }> {
        this.setIsLoading(true);
        try{
            const response = await UserService.requestReset(email);
            console.log(response);
            localStorage.setItem('passwordToken', response.data.passwordToken);
            this.setWantToResetPass(true);
            return {data:response.data};
        }
        catch (err: any) {
            this.setError(err.response?.data?.message)
            return { error: err.response?.data?.message || "Unknown error" };
        }
        finally {
            this.setIsLoading(false);
        }
    }

    async resetPassword(token:string,newPassword:string) : Promise<{message?:string; error?:string}> {
        try {
            if (this.wantToResetPassword && localStorage.getItem('passwordToken')) {
                const response = await UserService.resetPassword(token,newPassword);
                console.log(response);
                localStorage.removeItem('passwordToken');
                this.setWantToResetPass(false);
                return {message:response.data.message}
            }
             return {message:"Вы не можете поменять пароль!"}
        }
        catch (err: any) {
            this.setError(err.response?.data?.message)
            return {error:err.response?.data?.message || "Unknown error"};
        }
    }

    async loginWithGoogle(credential: string) {
        try {
            const response = await AuthService.googleAuth(credential);
            localStorage.setItem("token", response.data.accessToken);
            await this.checkAuth();
            if (this.user.isBlocked) {
                this.setError("Аккаунт заблокирован. Обратитесь к администратору.");
            }
        } catch (err: any) {
            this.setError(err.response?.data?.message || "Ошибка авторизации через Google");
        }
    }

    async login(email: string, password: string) {
        try {
            const response = await AuthService.login(email, password);
            console.log(response);
            localStorage.setItem("token", response.data.accessToken);
            await this.checkAuth();
            if (this.user.isBlocked) {
                this.setError("Аккаунт заблокирован. Обратитесь к администратору.");
            }
            if (this.user && !this.user.isActivated) {
                await this.logout(); 
                 this.setError("Аккаунт не активирован. Проверьте вашу почту.");
            }

        }
        catch (err: any) {
            this.setError(err.response?.data?.message)
            console.log(err.response?.data?.message);
        }
    }

    async register(email: string, password: string) {
        try{
            const response = await AuthService.register(email, password);
            console.log(response);
            localStorage.setItem("token", response.data.accessToken);
            await this.checkAuth();
            if (this.user && !this.user.isActivated) {
            await this.logout(); 
            }
            return true;
        }
        catch (err: any) {
            this.setError(err.response?.data?.message)
        }
    }

    async logout() {
        try{
            const response = await AuthService.logout();
            console.log(response);
            localStorage.removeItem("token");
            this.setAuth(false);
            this.setUser({} as IUser);
        }
        catch(err:any){
            console.log(err.response?.data?.message);
        }
    }

    async checkAuth(){
        this.setIsLoading(true);
        try{
            const response = await axios.get<IAuthResponse>(`${API_URL}/refresh`,{withCredentials:true});
            console.log(response);
            localStorage.setItem("token", response.data.accessToken);
            this.setIsActivated(response.data.user.isActivated);
            if (this.isActivated) {
                this.setAuth(true);
                this.setUser(response.data.user);
                this.setTotalStars(response.data.user.totalStars || 0);
            }
            else {
                this.setAuth(false);
            }
        }
        catch (err: any) {
            this.setError(err.response?.data?.message)
            console.log(err.response?.data?.message);
        }
        finally {
            this.setIsLoading(false);
        }
    }




}