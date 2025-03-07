import { Account, Avatars, Client, Databases, ID, Query, Storage } from 'react-native-appwrite';

export const config = {
    // endpoint: 'https://cloud.appwrite.io/v1',
    // platform: 'com.jsm.aora',
    // projectId: '676faceb0018066d653b',
    // databaseId: '6770257a003a05549f11',
    // userCollectionId: '677025ad003250d22984',
    // videoCollectionId: '677025dd000e20495faa',
    // storageId: '676fb24c0008f97eb9e2',

    
    endpoint: 'https://cloud.appwrite.io/v1',
    platform: 'com.jsm.aora',
    projectId: '6785e1900019e76dd638',   
    databaseId: '6785e41e003501f6e4b7',    
    userCollectionId: '6785e43e003003cb4b51',  
    videoCollectionId: '6785e45900048016ce31',   
    storageId: '6785e59c0014e27ac032',         

    
}

const { endpoint, platform, projectId, databaseId, userCollectionId, videoCollectionId, storageId } = config;

// Init your React Native SDK
const client = new Client();
client
    .setEndpoint(config.endpoint) // Your Appwrite Endpoint
    .setProject(config.projectId) // Your project ID
    .setPlatform(config.platform) // Your application ID or bundle ID.
;



const account = new Account(client); // account instance  using appwrite function "Account"
const avatars = new Avatars(client);
const databases = new Databases(client); // database instance using appwrite
const storage = new Storage(client);


export const createUser = async (email, password, username) =>{
    
        try {
            const newAccount = await account.create(
                ID.unique(),
                email,
                password,
                username
            )

            if(!newAccount) throw Error;


            const avatarUrl = avatars.getInitials(username);

            await signIn(email, password);

            // creating user in DB
            const newUser = await databases.createDocument(
                config.databaseId,
                config.userCollectionId,
                ID.unique(),
                {
                    accountId: newAccount.$id,
                    email: email,
                    username: username,
                    avatar: avatarUrl
                }
            );

            return newUser;

            
        } catch (error) {
                   throw new Error(error);
        }
}


export const signIn = async(email, password) => {
    try {
        const session = await account.createEmailPasswordSession(email, password)

        return session;
        
    } catch (error) {
        throw new Error(error);
    }
}


export async function getAccount() {
    try {
      const currentAccount = await account.get();
  
      return currentAccount;
    } catch (error) {
      throw new Error(error);
    }
  }


export const getCurrentUser = async () =>{
    try{
        const currentAccount = await getAccount();

        if(!currentAccount) throw Error;

        const currentUser = await databases.listDocuments(
            config.databaseId,
            config.userCollectionId,
            [Query.equal('accountId', currentAccount.$id)]
        );

        if(!currentUser) throw Error;

        return currentUser.documents[0];
    }catch(error){
        console.log(error);
        return null;
    }
}


export const getAllPosts = async () => {
    try {
        const posts = await databases.listDocuments(
            databaseId,
            videoCollectionId,
            [Query.orderDesc('$createdAt')]
        )

        return posts.documents;
        
    } catch (error) {
        throw new Error(error);
    }
}


export const getLatestPosts = async () => {
    try {
        const posts = await databases.listDocuments(
            databaseId,
            videoCollectionId,
            [Query.orderDesc('$createdAt', Query.limit(7))]
        )

        return posts.documents;
        
    } catch (error) {
        throw new Error(error);
    }
}


export const searchPosts = async (query) => {
    try{
        const posts = await databases.listDocuments(
            databaseId,
            videoCollectionId,
            [Query.search("title", query)]
        );
        return posts.documents;
    }
    catch(error){
        throw new Error(error);
    }
    
    
    
}


export const getUserPosts = async (userId) => {
    try{
        const posts = await databases.listDocuments(
            databaseId,
            videoCollectionId,
            [Query.equal("creator", userId), Query.orderDesc('$createdAt')],
            []
        );
        return posts.documents;
    }
    catch(error){
        throw new Error(error);
    }
    
}


export const signOut = async () => {
    try {
        const session = await account.deleteSession('current');

        return session;
    } catch (error) {
        throw new Error(error);
        
    }
}


export const getFilePreview = async (fileId, type) => {
    let fileUrl;

    try{
        if( type === 'video'){
            fileUrl = storage.getFileView(storageId, fileId)
        } else if(type === 'image'){
            fileUrl = storage.getFilePreview(storageId, fileId, 2000, 2000, 'top', 100)
        } else{
            throw new Error('Invalid file type')
        }

        if(!fileUrl) throw Error;

        return fileUrl;
    }catch(error){
        throw new Error(error);
    }

}


export const uploadFile = async (file, type) => {
    if(!file) return;

    const asset = {
        name: file.fileName,
        type: file.mimeType,
        size: file.fileSize,
        uri: file.uri,
    };



    try {
        const uploadedFile = await storage.createFile(
            storageId,
            ID.unique(),
            asset
        );
      

        const fileUrl = await getFilePreview(uploadedFile.$id, type);

        return fileUrl;
    } catch (error) {
        throw new Error(error);
        
    }
}


export const createVideo = async (form) =>{
    try {
        const [thumbnailUrl, videoUrl] = await Promise.all([
            uploadFile(form.thumbnail, 'image'),
            uploadFile(form.video, 'video')
        ])


        const newPost = await databases.createDocument(
            config.databaseId, config.videoCollectionId, ID.unique(), {
                title:form.title,
                thumbnail: thumbnailUrl,
                video: videoUrl,
                prompt: form.prompt,
                creator: form.userId
            }
        )

        return newPost;
    } catch (error) {
        console.log("error is ", error)
        throw new Error(error);
    }
}