// backend/src/main/java/com/yourcompany/onlineexam/service/CourseService.java

package com.yourcompany.onlineexam.service;

import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.yourcompany.onlineexam.model.Course;
import com.yourcompany.onlineexam.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;
 
@Service
public class CourseService {

    private final Firestore firestore;
    private static final String COLLECTION_NAME = "courses";
    
    @Autowired
    private NotificationService notificationService;

    public CourseService(Firestore firestore) {
        this.firestore = firestore;
    }

    public List<Course> getAllCourses() throws ExecutionException, InterruptedException {
        List<Course> courses = new ArrayList<>();
        CollectionReference courseCollection = firestore.collection(COLLECTION_NAME);
        for (QueryDocumentSnapshot document : courseCollection.get().get().getDocuments()) {
            courses.add(document.toObject(Course.class));
        }
        return courses;
    }

    public Course createCourse(Course course) throws ExecutionException, InterruptedException {
        DocumentReference documentReference = firestore.collection(COLLECTION_NAME).document();
        course.setId(documentReference.getId());
        documentReference.set(course).get();
        return course;
    }
    
    // =================== CODE MỚI THÊM VÀO ===================

    /**
     * Cập nhật thông tin một môn học đã có
     * @param subjectId ID của môn học cần cập nhật
     * @param subjectDetails Đối tượng Subject chứa thông tin mới
     * @return Đối tượng Subject đã được cập nhật
     */
    public Course updateCourse(String courseId, Course courseDetails) throws ExecutionException, InterruptedException {
        DocumentReference documentReference = firestore.collection(COLLECTION_NAME).document(courseId);
        // Đảm bảo ID trong object cũng được cập nhật đúng
        courseDetails.setId(courseId); 
        documentReference.set(courseDetails).get();
        return courseDetails;
    }

    /**
     * Xóa một môn học dựa trên ID
     * @param subjectId ID của môn học cần xóa
     */
    public void deleteCourse(String courseId) {
        firestore.collection(COLLECTION_NAME).document(courseId).delete();
    }

    // =================== QUẢN LÝ SINH VIÊN TRONG MÔN HỌC ===================
    public List<String> getStudentsOfCourse(String courseId) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(courseId);
        DocumentSnapshot snapshot = docRef.get().get();
        Course course = snapshot.toObject(Course.class);
        if (course != null && course.getStudents() != null) {
            return course.getStudents();
        }
        return new ArrayList<>();
    }

    public void addStudentToCourse(String courseId, String studentId) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(courseId);
        DocumentSnapshot snapshot = docRef.get().get();
        Course course = snapshot.toObject(Course.class);
        if (course == null) return;
        List<String> students = course.getStudents();
        if (students == null) students = new ArrayList<>();
        if (!students.contains(studentId)) {
            students.add(studentId);
            course.setStudents(students);
            docRef.set(course).get();
            
            // Push notification cho student được thêm vào course
            try {
                pushNotificationForAddedToCourse(course, studentId);
            } catch (Exception e) {
                System.err.println("Lỗi khi push notification cho student được thêm vào course: " + e.getMessage());
                // Không throw exception để không ảnh hưởng đến việc thêm student
            }
        }
    }

    public void removeStudentFromCourse(String courseId, String studentId) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(courseId);
        DocumentSnapshot snapshot = docRef.get().get();
        Course course = snapshot.toObject(Course.class);
        if (course == null) return;
        List<String> students = course.getStudents();
        if (students != null && students.contains(studentId)) {
            students.remove(studentId);
            course.setStudents(students);
            docRef.set(course).get();
        }
    }
    
    /**
     * Push notification cho student khi được thêm vào course
     */
    private void pushNotificationForAddedToCourse(Course course, String studentId) throws ExecutionException, InterruptedException {
        // Lấy thông tin user để có tên hiển thị
        User user = getUserById(studentId);
        String userName = "Sinh viên";
        if (user != null) {
            if (user.getFirstName() != null && user.getLastName() != null) {
                userName = user.getFirstName() + " " + user.getLastName();
            } else if (user.getFirstName() != null) {
                userName = user.getFirstName();
            } else if (user.getUsername() != null) {
                userName = user.getUsername();
            }
        }
        
        // Tạo nội dung notification
        String title = "Đã được thêm vào lớp";
        String message = String.format("Xin chào %s! Bạn đã được thêm vào lớp \"%s\"", 
            userName, course.getName());
        
        // Push notification cho student
        notificationService.pushNotificationToUser(
            studentId, 
            title, 
            message, 
            "course_added", 
            course.getId()
        );
        
        System.out.println("Đã push notification cho student " + studentId + " về việc được thêm vào course: " + course.getName());
    }
    
    /**
     * Lấy thông tin user theo ID
     */
    private User getUserById(String userId) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection("users").document(userId);
        DocumentSnapshot doc = docRef.get().get();
        if (doc.exists()) {
            User user = doc.toObject(User.class);
            // User model sử dụng @DocumentId cho trường uid, không cần setId
            return user;
        }
        return null;
    }

    /**
     * Tra cứu userId từ email (không phân biệt hoa/thường, loại bỏ dấu cách thừa)
     */
    public String findUserIdByEmail(String email) throws ExecutionException, InterruptedException {
        String normalizedEmail = email.trim().toLowerCase();
        CollectionReference usersRef = firestore.collection("users");
        List<QueryDocumentSnapshot> docs = usersRef.whereEqualTo("email", normalizedEmail).get().get().getDocuments();
        if (!docs.isEmpty()) {
            return docs.get(0).getId();
        }
        return null;
    }

    /**
     * Thêm sinh viên vào lớp bằng email hoặc userId (uid)
     * Nếu là email, tra cứu userId từ Firestore. Chỉ thêm và gửi notification nếu userId hợp lệ.
     */
    public void addStudentToCourseByEmailOrUid(String courseId, String emailOrUid) throws ExecutionException, InterruptedException {
        // Loại bỏ dấu ngoặc kép thừa và trim
        String cleaned = emailOrUid.replaceAll("^\"+|\"+$", "").trim();
        String userId = cleaned;
        // Nếu là email, tra cứu userId
        if (userId.contains("@")) {
            String foundId = findUserIdByEmail(userId);
            if (foundId == null) {
                System.err.println("[CourseService] Không tìm thấy user với email: " + userId);
                return;
            }
            userId = foundId;
        }
        // Kiểm tra userId có tồn tại trong bảng users không
        User user = getUserById(userId);
        if (user == null) {
            System.err.println("[CourseService] UserId không hợp lệ hoặc không tồn tại: " + userId);
            return;
        }
        // Thêm vào lớp và push notification
        addStudentToCourse(courseId, userId);
    }

    /**
     * Lấy thông tin một môn học theo ID
     */
    public Course getCourseById(String courseId) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(courseId);
        DocumentSnapshot snapshot = docRef.get().get();
        if (snapshot.exists()) {
            return snapshot.toObject(Course.class);
        }
        return null;
    }

    // ==========================================================
}