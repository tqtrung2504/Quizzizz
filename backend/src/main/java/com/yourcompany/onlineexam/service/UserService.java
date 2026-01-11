package com.yourcompany.onlineexam.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import com.yourcompany.onlineexam.model.User;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@Service
public class UserService {
    private static final String COLLECTION_NAME = "users";

    public List<User> getAll() throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME).get();
        List<QueryDocumentSnapshot> docs = future.get().getDocuments();
        List<User> users = new ArrayList<>();
        for (QueryDocumentSnapshot doc : docs) {
            User user = doc.toObject(User.class);
            users.add(user);
        }
        return users;
    }

    public User create(User user) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        ApiFuture<DocumentReference> future = db.collection(COLLECTION_NAME).add(user);
        String id = future.get().getId();
        user.setUid(id);
        db.collection(COLLECTION_NAME).document(id).set(user);
        return user;
    }

    public User update(String uid, User user) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        db.collection(COLLECTION_NAME).document(uid).set(user);
        return user;
    }

    public void delete(String uid) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        db.collection(COLLECTION_NAME).document(uid).delete();
    }

    public User changeRole(String uid, String role) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        DocumentReference ref = db.collection(COLLECTION_NAME).document(uid);
        ref.update("role", role);
        User user = ref.get().get().toObject(User.class);
        return user;
    }

    public User disableUser(String uid, boolean isDeleted) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        DocumentReference ref = db.collection(COLLECTION_NAME).document(uid);
        ref.update("isDeleted", isDeleted);
        User user = ref.get().get().toObject(User.class);
        return user;
    }

    /**
     * Tìm userId theo email
     */
    public String findUserIdByEmail(String email) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            Query query = db.collection(COLLECTION_NAME)
                .whereEqualTo("email", email.toLowerCase().trim());
            
            ApiFuture<QuerySnapshot> future = query.get();
            List<QueryDocumentSnapshot> docs = future.get().getDocuments();
            
            if (!docs.isEmpty()) {
                return docs.get(0).getId();
            }
            return null;
        } catch (Exception e) {
            System.err.println("Lỗi khi tìm user theo email: " + e.getMessage());
            return null;
        }
    }

    /**
     * Lấy thông tin user
     */
    public Map<String, Object> getUserInfo(String userId) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            DocumentReference docRef = db.collection(COLLECTION_NAME).document(userId);
            ApiFuture<DocumentSnapshot> future = docRef.get();
            DocumentSnapshot document = future.get();
            
            Map<String, Object> userInfo = new HashMap<>();
            if (document.exists()) {
                userInfo.put("uid", document.getId());
                userInfo.put("email", document.getString("email"));
                userInfo.put("username", document.getString("username"));
                userInfo.put("displayName", document.getString("displayName"));
                userInfo.put("photoURL", document.getString("photoURL"));
                userInfo.put("role", document.getString("role"));
                userInfo.put("phone", document.getString("phone"));
                userInfo.put("address", document.getString("address"));
                userInfo.put("bio", document.getString("bio"));
                userInfo.put("studentId", document.getString("studentId"));
                userInfo.put("major", document.getString("major"));
                userInfo.put("year", document.getString("year"));
            }
            return userInfo;
        } catch (Exception e) {
            System.err.println("Lỗi khi lấy thông tin user: " + e.getMessage());
            return new HashMap<>();
        }
    }
} 