import { addDoc, collection } from "firebase/firestore";
import { DemoBook, DemoCharacters } from "../constants/DemoData";
import { db } from "../firebaseConfig";

export const SeedService = {
    seedDemoData: async (authorId: string) => {
        try {
            // 1. Create the Book
            const bookRef = await addDoc(collection(db, "books"), {
                ...DemoBook,
                authorId: authorId,
                createdAt: new Date()
            });

            const bookId = bookRef.id;

            // 2. Create the Characters linked to the Book
            const charPromises = DemoCharacters.map(char =>
                addDoc(collection(db, "characters"), {
                    ...char,
                    bookId: bookId,
                    authorId: authorId,
                    createdAt: new Date()
                })
            );

            await Promise.all(charPromises);

            return { success: true };
        } catch (error) {
            console.error("Error seeding demo data:", error);
            return { success: false, error };
        }
    }
};
