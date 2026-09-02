export const baseUrl = 'https://pjsofttech.in:46443';

// Get API for Teacher
export const LoginUrlByTeacher = `${baseUrl}/teacherlogin`;
export const passfailUrl = `${baseUrl}/passfailcount`;
export const examTypeUrl = `${baseUrl}/examtypebyteacher`;
export const paperTypeUrl = `${baseUrl}/papertypebyteacher`;
export const classroomByTeacherUrl = `${baseUrl}/classroomsbyteacheremail`;
export const admissionsByTeacherUrl = `${baseUrl}/getAdmissionsByTeacherEmail`;
export const studentResultByTeacherUrl = `${baseUrl}/getAllStudentResults`;
export const attendanceFilterByTeacherUrl = `${baseUrl}/attendancefilter`;
export const getTopicNamesUrl = `${baseUrl}/getTopicNames`;
export const getTopicIdUrl = `${baseUrl}/getIdByTopicName`;
export const getStudentResultUrl = `${baseUrl}/getStudentResult`;
export const homeworkByTeacherAndClassUrl = `${baseUrl}/getHomeworkByTeacherAndClass`;
export const getSubmissionsForHomeworkUrl = `${baseUrl}/getSubmissionsForHomework`;
export const studentsByClassUrl = `${baseUrl}/studentsbyclass`;
export const getAllClassRoomSubjectDetailsUrl = `${baseUrl}/getAllClassRoomSubjectDetails`;
export const getInstituteDetailsUrl = `${baseUrl}/getInstituteDetails`;

// PUT API for Teacher
export const updateClassRoomSubjectDetailsUrl = `${baseUrl}/updateClassRoomSubjectDetails`;

// Post API for Teacher
export const createClassRoomSubjectDetailsUrl = `${baseUrl}/createClassRoomSubjectDetails`;
export const createStudentSubjectResultUrl = `${baseUrl}/createStudentSubjectResult`;
export const manualMarkAttendanceUrl = `${baseUrl}/manualMarkAttendance`;
export const assignHomeworkUrl = `${baseUrl}/assignHomework`;

// POST API for Manual Logout
export const manualLogoutUrl = `${baseUrl}/manuallogout`;

// Get API for student
export const getAttendanceCountByFormIdUrl = `${baseUrl}/getAttendanceCountByFormId`;
export const getUserResultUrl = `${baseUrl}/getuserResult`;
export const getUserByIdUrl = `${baseUrl}/usergetById`;
export const getTimetableByClassRoomIdUrl = `${baseUrl}/getTimetableByClassRoomId`;
export const submitHomeworkUrl = `${baseUrl}/submitHomework`;

// POST API for Student
export const LoginUrlByStudent = `${baseUrl}/userlogin`;
export const sendOtpUrl = `${baseUrl}/sendotp`;
export const resetUserPasswordUrl = `${baseUrl}/resetuserpassword`;

// POST API for parent
export const sendOtpParentUrl = `${baseUrl}/sendotpparent`;
export const resetParentPasswordUrl = `${baseUrl}/resetpasswordparent`;
export const LoginUrlByParent = `${baseUrl}/parentlogin`;

// GET API for parent
export const getHomeworkForStudentUrl = `${baseUrl}/getHomeworkForStudent`;
