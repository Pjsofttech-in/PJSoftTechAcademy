// Apicall.js - Fixed API call management with token handling and specific API functions
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {jwtDecode} from 'jwt-decode';
import {
  LoginUrlByTeacher,
  admissionsByTeacherUrl,
  classroomByTeacherUrl,
  examTypeUrl,
  paperTypeUrl,
  passfailUrl,
  studentResultByTeacherUrl,
  attendanceFilterByTeacherUrl,
  createClassRoomSubjectDetailsUrl,
  getTopicNamesUrl,
  getTopicIdUrl,
  createStudentSubjectResultUrl,
  manualMarkAttendanceUrl,
  manualLogoutUrl,
  getStudentResultUrl,
  homeworkByTeacherAndClassUrl,
  assignHomeworkUrl,
  getSubmissionsForHomeworkUrl,
  studentsByClassUrl,
  updateClassRoomSubjectDetailsUrl,
  getAllClassRoomSubjectDetailsUrl,
  getInstituteDetailsUrl,
} from './Url';

import {
  LoginUrlByStudent,
  resetUserPasswordUrl,
  getAttendanceCountByFormIdUrl,
  getUserResultUrl,
  getUserByIdUrl,
  getHomeworkForStudentUrl,
  sendOtpUrl,
  getTimetableByClassRoomIdUrl,
} from './Url';

import {
  sendOtpParentUrl,
  resetParentPasswordUrl,
  LoginUrlByParent,
} from './Url';

let tokenExpiredCallback = null;

// Set callback for token expiration
export const setTokenExpiredCallback = callback => {
  tokenExpiredCallback = callback;
};

// Get token from AsyncStorage
const getToken = async () => {
  try {
    const role = await AsyncStorage.getItem('userRole');
    const token = await AsyncStorage.getItem(`${role}Token`);
    console.log('retrieved token : ', token);
    return token;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

// Check if token is expired
const isTokenExpired = token => {
  try {
    if (!token) return true;
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (error) {
    console.error('Token decode error:', error);
    return true;
  }
};

// Handle token expiration
const handleTokenExpiration = async () => {
  try {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
    if (tokenExpiredCallback) {
      tokenExpiredCallback();
    }
  } catch (error) {
    console.error('Error handling token expiration:', error);
  }
};

// Create axios instance for authenticated requests
const createAuthenticatedAxios = () => {
  const instance = axios.create({
    timeout: 30000,
  });

  // Request interceptor to add token
  instance.interceptors.request.use(
    async config => {
      const token = await getToken();

      if (token) {
        // Check if token is expired before making request
        if (isTokenExpired(token)) {
          await handleTokenExpiration();
          return Promise.reject(new Error('Token expired'));
        }

        config.headers.Authorization = `Bearer ${token}`;
        console.log('request with token ', config.url);
      }

      return config;
    },
    error => {
      return Promise.reject(error);
    },
  );

  // Response interceptor to handle 401 errors
  instance.interceptors.response.use(
    response => {
      return response;
    },
    async error => {
      if (error.response && error.response.status === 401) {
        await handleTokenExpiration();
      }
      return Promise.reject(error);
    },
  );

  return instance;
};

// Public API calls (no authentication required)
export const publicAPI = async (url, data, method = 'GET') => {
  try {
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data && method !== 'GET') {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(url, config);

    // Handle all non-successful responses
    if (!response.ok) {
      let errorMessage = 'Something went wrong. Please try again.';

      try {
        // Try reading the response JSON (if backend sent one)
        const errorData = await response.json();

        if (errorData?.message) {
          // Use backend message if available
          errorMessage = errorData.message;
        } else if (response.status === 400) {
          errorMessage = 'Invalid request. Please check your input.';
        } else if (response.status === 401 || response.status === 403) {
          errorMessage = 'Invalid email or password. Please try again.';
        } else if (response.status === 404) {
          errorMessage = 'Requested resource not found.';
        } else if (response.status === 500) {
          errorMessage = 'Internal server issue. Please try again later.';
        }
      } catch (jsonError) {
        // Fallback if response isn’t JSON (e.g., HTML or empty)
        if (response.status === 401 || response.status === 403) {
          errorMessage = 'Invalid email or password.';
        } else if (response.status === 500) {
          errorMessage =
            'Server is temporarily unavailable. Please try again later.';
        } else if (response.status >= 400 && response.status < 500) {
          errorMessage =
            'There was a problem with your request. Please check and try again.';
        }
      }

      throw new Error(errorMessage);
    }

    // Success: parse response JSON
    return await response.json();
  } catch (error) {
    // Handle network or unexpected errors
    if (error.message === 'Network request failed') {
      throw new Error(
        'Unable to connect. Please check your internet connection.',
      );
    }

    console.error('Public API call failed:', error);
    throw new Error(
      error.message || 'Unexpected error occurred. Please try again later.',
    );
  }
};

export const authenticatedAPI = async (url, data, method = 'GET') => {
  try {
    const role = await AsyncStorage.getItem('userRole');
    const token = await AsyncStorage.getItem(`${role}Token`);

    if (!token) {
      throw new Error('No authentication token found');
    }

    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    };

    if (data && method !== 'GET') {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      if (response.status === 401) {
        await AsyncStorage.removeItem(`${role}Token`);
        throw new Error('Authentication failed. Please login again.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Authenticated API call failed:', error);
    throw error;
  }
};

// Login API call (public) for Teacher
export const loginTeacher = async (email, password) => {
  try {
    const response = await publicAPI(
      LoginUrlByTeacher,
      {email, password},
      'POST',
    );

    if (response.token) {
      await AsyncStorage.setItem('userToken', response.token);
      await AsyncStorage.setItem('teacherToken', response.token); // ✅ fix added
      await AsyncStorage.setItem('userRole', 'teacher');
      if (response.data) {
        await AsyncStorage.setItem('userData', JSON.stringify(response.data));
      }
    }

    return response;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
};

// Fetch exam types
export const fetchExamTypes = async ({email, role, branchCode}) => {
  try {
    const url = `${examTypeUrl}?email=${encodeURIComponent(
      email,
    )}&role=${encodeURIComponent(role)}&branchCode=${encodeURIComponent(
      branchCode,
    )}`;

    console.log('👉 [fetchExamTypes] Constructed URL:', url);

    // Check token validity before making API call
    const token = await AsyncStorage.getItem('userToken');
    // Use authenticated API helper
    const response = await authenticatedAPI(url, null, 'GET');

    console.log('👉 [fetchExamTypes] Constructed URL:', response);

    // Normalize response
    if (Array.isArray(response)) {
      return response;
    } else if (response?.data && Array.isArray(response.data)) {
      return response.data;
    } else if (response?.examTypes && Array.isArray(response.examTypes)) {
      return response.examTypes;
    }

    console.warn(
      '⚠️ [fetchExamTypes] Response did not match expected formats. Returning empty array.',
    );
    return [];
  } catch (error) {
    console.error('❌ [fetchExamTypes] ERROR:', error.message);

    if (error.response) {
      console.error('❗ Response status:', error.response.status);
      console.error('❗ Response data:', error.response.data);
    }

    throw error;
  }
};

// Fetch paper types
export const fetchPaperTypes = async ({email, role, branchCode}) => {
  try {
    const url = `${paperTypeUrl}?email=${encodeURIComponent(
      email,
    )}&role=${encodeURIComponent(role)}&branchCode=${encodeURIComponent(
      branchCode,
    )}`;

    // Use the central token-handling function
    const response = await authenticatedAPI(url, null, 'GET');

    // Normalize structure
    if (Array.isArray(response)) {
      return response;
    } else if (response?.data && Array.isArray(response.data)) {
      return response.data;
    } else if (response?.paperTypes && Array.isArray(response.paperTypes)) {
      return response.paperTypes;
    }

    console.warn('⚠️ [fetchPaperTypes] Unexpected structure:', response);
    return [];
  } catch (error) {
    console.error('❌ [fetchPaperTypes] Error:', error.message);
    throw error;
  }
};

// Fetch pass/fail data
export const fetchPassFailData = async (
  userEmail,
  {role, examType, paperType},
) => {
  try {
    if (!userEmail) {
      throw new Error('User email is required');
    }

    let apiUrl = `${passfailUrl}?role=${role}&email=${encodeURIComponent(
      userEmail,
    )}`;

    if (examType && examType !== 'ALL') {
      apiUrl += `&examType=${encodeURIComponent(examType)}`;
    }

    if (paperType && paperType !== 'ALL') {
      apiUrl += `&paperType=${encodeURIComponent(paperType)}`;
    }

    console.log('🔗 Final API URL:', apiUrl); // ✅ Debug the full request

    const response = await authenticatedAPI(apiUrl, null, 'GET');

    return response;
  } catch (error) {
    console.error('Error fetching pass/fail data:', error);
    throw error;
  }
};

// fetch Classroom data by Teacher
export const fetchClassroomByTeacher = async (
  teacherEmail,
  role = 'teacher',
) => {
  if (!teacherEmail) throw new Error('Teacher Email is required');

  const apiUrl = `${classroomByTeacherUrl}?teacherEmail=${encodeURIComponent(
    teacherEmail,
  )}&role=${role}&email=${encodeURIComponent(teacherEmail)}`;

  try {
    const response = await authenticatedAPI(apiUrl, null, 'GET');

    let classrooms = [];

    if (Array.isArray(response)) {
      classrooms = response;
    } else if (response?.data && Array.isArray(response.data)) {
      classrooms = response.data;
    } else if (response?.classrooms && Array.isArray(response.classrooms)) {
      classrooms = response.classrooms;
    }

    return classrooms;
  } catch (error) {
    console.error('Error fetching classroom data:', error);
    throw error;
  }
};

// Updated fetchTopicNamesByTeacher function in Apicall.js
export const fetchTopicNamesByTeacher = async ({
  classroomId,
  subjectId,
  examTypeId,
  paperTypeId,
  role = 'teacher',
  email,
}) => {
  try {
    if (!classroomId || !subjectId || !examTypeId || !paperTypeId || !email) {
      throw new Error('All parameters are required for fetching topic names.');
    }

    // Convert 'all' to numeric value (0) to match API expectations
    const processedExamTypeId =
      examTypeId === 'all' ? 0 : parseInt(examTypeId) || examTypeId;
    const processedPaperTypeId =
      paperTypeId === 'all' ? 0 : parseInt(paperTypeId) || paperTypeId;

    console.log('🔍 Fetching topics with payload:', {
      classroomId,
      subjectId,
      examTypeId: processedExamTypeId,
      paperTypeId: processedPaperTypeId,
      role,
      email,
    });

    const url = `${getTopicNamesUrl}?classroomId=${encodeURIComponent(
      classroomId,
    )}&subjectId=${encodeURIComponent(
      subjectId,
    )}&examTypeId=${encodeURIComponent(
      processedExamTypeId,
    )}&paperTypeId=${encodeURIComponent(
      processedPaperTypeId,
    )}&role=${encodeURIComponent(role)}&email=${encodeURIComponent(email)}`;

    console.log('🔗 Final URL:', url);

    const response = await authenticatedAPI(url, null, 'GET');

    // Process the response to extract topic names
    let topicNames = [];

    if (Array.isArray(response)) {
      topicNames = response;
    } else if (response?.data && Array.isArray(response.data)) {
      topicNames = response.data;
    } else if (response?.topicNames && Array.isArray(response.topicNames)) {
      topicNames = response.topicNames;
    } else {
      console.warn('⚠️ Unexpected response format:', response);
      return [];
    }

    // Filter and clean topic names with enhanced duplicate handling
    const validTopicNames = topicNames
      .filter(topic => topic !== null && topic !== undefined)
      .map(topic => {
        // Handle both string and object formats
        if (typeof topic === 'string') {
          return topic.trim();
        } else if (topic && typeof topic === 'object' && topic.topicName) {
          return topic.topicName.trim();
        }
        return null;
      })
      .filter(topicName => topicName && topicName !== '')
      .filter((topicName, index, self) => {
        // Advanced duplicate removal with case-insensitive comparison
        const lowerCaseName = topicName.toLowerCase();
        return (
          self.findIndex(name => name.toLowerCase() === lowerCaseName) === index
        );
      })
      .sort(); // Sort alphabetically

    // If no valid topics found, return empty array instead of throwing error
    if (validTopicNames.length === 0) {
      console.log('⚠️ No valid topic names found for the given parameters');
      return [];
    }

    return validTopicNames;
  } catch (error) {
    console.error('❌ Error fetching topic names:', error);

    // Instead of throwing, return empty array to prevent app crashes
    if (error.response?.status === 404) {
      console.log('📭 No topics found for the given parameters');
      return [];
    } else if (error.response?.status === 500) {
      console.log(
        '🔧 Server error (possibly duplicate topic names), returning empty array',
      );
      return [];
    } else {
      console.log('🔄 Unknown error, returning empty array to prevent crashes');
      return [];
    }
  }
};
// fetch Student Result data by Teacher
export const fetchStudentResultsByTeacher = async (
  role = 'teacher',
  teacherEmail,
  branchCode,
) => {
  try {
    if (!teacherEmail || !branchCode) {
      throw new Error('Teacher email and branch code is required');
    }

    const url = `${studentResultByTeacherUrl}?role=${encodeURIComponent(
      role,
    )}&email=${encodeURIComponent(
      teacherEmail,
    )}&branchCode=${encodeURIComponent(branchCode)}`;
    const response = await authenticatedAPI(url, null, 'GET');

    // console.log('📦 Raw Student Result Response: ', response);

    let studentList = [];

    if (Array.isArray(response)) {
      studentList = response;
    } else if (response?.data && Array.isArray(response.Data)) {
      studentList = response.data;
    } else if (response?.students && Array.isArray(response.students)) {
      studentList = response.students;
    }

    return studentList;
  } catch (error) {
    console.error('Error fetching student list : ', error);
    throw error;
  }
};

// Fetch Admission List by Teacher
export const fetchAdmissionListByTeacher = async (
  teacherEmail,
  branchCode,
  role = 'teacher',
) => {
  try {
    if (!teacherEmail || !branchCode) {
      throw new Error('teacher email and branch code are required');
    }

    const url = `${admissionsByTeacherUrl}?role=${encodeURIComponent(
      role,
    )}&email=${encodeURIComponent(
      teacherEmail,
    )}&branchCode=${encodeURIComponent(branchCode)}`;
    const response = await authenticatedAPI(url, null, 'GET');

    let admissionsList = [];

    if (Array.isArray(response)) {
      admissionsList = response;
    } else if (response?.data && Array.isArray(response.data)) {
      admissionsList = response.data;
    } else if (response?.admissions && Array.isArray(response.admissions)) {
      admissionsList = response.admissions;
    }

    return admissionsList.map(student => ({
      id: student.id,
      rollNo: student.rollNo,
      name: student.name,
      marathi1: null,
      marathi2: null,
      hindi1: null,
      hindi2: null,
      academicYear: student.academicYear,
      coursename: student.coursename,
      mediumName: student.mediumName,
      admissionClassRoom: student.admissionClassRoom,
    }));
  } catch (error) {
    console.error('Error fetching admissions:', error);
    throw error;
  }
};

// Fetch attendance data by classroomId and branchCode
export const fetchAttendanceDataByTeacher = async ({
  classroomId,
  filter = 'today',
  branchCode,
}) => {
  if (!classroomId || !branchCode) {
    throw new Error('classroomId and branchCode are required');
  }

  const apiUrl = `${attendanceFilterByTeacherUrl}?classroomId=${encodeURIComponent(
    classroomId,
  )}&filter=${encodeURIComponent(filter)}&branchCode=${encodeURIComponent(
    branchCode,
  )}`;

  try {
    const response = await authenticatedAPI(apiUrl, null, 'GET');

    return {
      presentData: response?.presentData || [],
      absentData: response?.absentData || [],
      presentCount: response?.presentCount ?? 0,
      absentCount: response?.absentCount ?? 0,
      totalStudents: response?.totalStudents ?? 0,
    };
  } catch (error) {
    console.error('Error fetching attendance data:', error);
    throw error;
  }
};

// Check token validity
export const checkTokenValidity = async () => {
  const token = await getToken();
  if (!token) return false;

  if (isTokenExpired(token)) {
    await handleTokenExpiration();
    return false;
  }
  return true;
};

// Attendance mark by Teacher POST API
export const submitManualAttendance = async ({
  classroomId,
  branchCode,
  rollNumbers,
}) => {
  try {
    const token = await AsyncStorage.getItem('teacherToken');
    const url = `${manualMarkAttendanceUrl}?classroomId=${classroomId}&branch_code=${branchCode}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(rollNumbers),
    });

    const text = await response.text(); // <-- read as plain text

    if (!response.ok) {
      throw new Error(text || 'Error submitting attendance');
    }

    return {message: text}; // mimic JSON structure for compatibility
  } catch (error) {
    console.error('❌ Error submitting manual attendance:', error);
    throw error;
  }
};

export const fetchStudentsByClass = async ({
  classId,
  role = 'teacher',
  email,
}) => {
  try {
    if (!classId || !email) {
      throw new Error('classId and email are required');
    }

    const url = `${studentsByClassUrl}?classId=${encodeURIComponent(
      classId,
    )}&role=${encodeURIComponent(role)}&email=${encodeURIComponent(email)}`;

    console.log('🎓 [fetchStudentsByClass] Request URL:', url);

    const response = await authenticatedAPI(url, null, 'GET');

    console.log('✅ [fetchStudentsByClass] Response:', response);

    // Normalize response — handle array or wrapped object
    if (Array.isArray(response)) {
      return response;
    } else if (response?.data && Array.isArray(response.data)) {
      return response.data;
    } else if (response?.students && Array.isArray(response.students)) {
      return response.students;
    }

    console.warn(
      '⚠️ [fetchStudentsByClass] Unexpected response format:',
      response,
    );
    return [];
  } catch (error) {
    console.error('❌ [fetchStudentsByClass] Error:', error.message);
    return [];
  }
};

// Get stored user data
export const getStoredUserData = async () => {
  try {
    const userDataString = await AsyncStorage.getItem('userData');
    return userDataString ? JSON.parse(userDataString) : null;
  } catch (error) {
    console.error('Error getting stored user data:', error);
    return null;
  }
};

// POST API
export const createClassroomSubjectDetails = async ({
  email,
  role,
  data,
  topicName, // Optional: if provided, will fetch and include topic ID
}) => {
  try {
    if (!email || !role || !data) {
      throw new Error('Email, role, and data are required');
    }

    let finalData = {...data};

    // If topicName is provided, fetch its ID and add to data
    if (topicName) {
      try {
        const topicId = await getTopicIdByName(topicName, email, role);
        if (topicId) {
          finalData.topicId = topicId;
          console.log('✅ Added topic ID to data:', topicId);
        } else {
          console.warn('⚠️ Could not fetch topic ID for:', topicName);
        }
      } catch (topicError) {
        console.error('❌ Error fetching topic ID:', topicError);
        // Continue without topic ID if fetch fails
      }
    }

    const url = `${createClassRoomSubjectDetailsUrl}?role=${encodeURIComponent(
      role,
    )}&email=${encodeURIComponent(email)}`;

    console.log('🔗 Creating classroom subject details URL:', url);
    console.log('📦 Final data payload:', finalData);

    const response = await authenticatedAPI(url, finalData, 'POST');
    console.log('✅ Create classroom subject details response:', response);

    return response;
  } catch (error) {
    console.error('❌ Error in createClassroomSubjectDetails:', error);
    throw error;
  }
};

//  submit student subject result POST API
export const submitStudentSubjectResult = async (
  payload,
  email,
  role = 'teacher',
) => {
  try {
    const token = await getToken(); // ✅ Reuse existing token fetch

    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // ✅ Force role to "teacher" if it's "staff"
    const finalRole = role === 'staff' ? 'teacher' : role;

    const url = `${createStudentSubjectResultUrl}?role=${encodeURIComponent(
      finalRole,
    )}&email=${encodeURIComponent(email)}`;

    // Make sure payload is always an array
    const finalPayload = Array.isArray(payload) ? payload : [payload];

    console.log('🚀 Submitting result with URL:', url);
    console.log('📦 Payload:', finalPayload);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(finalPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ Error in submitStudentSubjectResult API:', error);
    throw error;
  }
};

// Alternative approach if you need to pass token as parameter
export const submitStudentSubjectResultWithToken = async (
  payload,
  email,
  role = 'teacher',
  authToken,
) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(
      `${createStudentSubjectResultUrl}?role=${role}&email=${encodeURIComponent(
        email,
      )}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ Error in submitStudentSubjectResult API:', error);
    throw error;
  }
};

// Manual Logout POST API for Teacher
export const submitManualLogout = async ({
  classroomId,
  branchCode,
  studentIds, // array like [2]
}) => {
  try {
    const token = await AsyncStorage.getItem('teacherToken');
    const url = `${manualLogoutUrl}?classroomId=${classroomId}&branch_code=${branchCode}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(studentIds),
    });

    const text = await response.text(); // It's a plain text response

    if (!response.ok) {
      throw new Error(text || 'Error performing manual logout');
    }

    return {message: text}; // returns: { message: "Manual logout marked successfully." }
  } catch (error) {
    console.error('❌ Manual logout failed:', error);
    throw error;
  }
};

export const getTopicId = async (topicName, role, email) => {
  try {
    const response = await axios.get(getTopicIdUrl, {
      params: {
        topicName,
        role,
        email,
      },
    });
    return response.data; // Should contain the unique topic ID
  } catch (error) {
    console.error('Error fetching topic ID:', error);
    throw error;
  }
};

// ✅ NEW: Function to get topic ID by topic name
export const getTopicIdByName = async (topicName, email, role) => {
  try {
    const url = `${getTopicIdUrl}?topicName=${encodeURIComponent(
      topicName,
    )}&role=${role}&email=${encodeURIComponent(email)}`;
    console.log('🔗 Fetching Topic ID URL:', url);

    const axiosInstance = createAuthenticatedAxios();
    const response = await axiosInstance.get(url);

    // ✅ Fix: API returns plain number, not { id: ... }
    if (typeof response.data === 'number') {
      return response.data;
    } else if (response?.data?.id) {
      return response.data.id;
    }

    console.warn(`⚠️ No topic ID returned for: ${topicName}`);
    return null;
  } catch (error) {
    console.error(`❌ Error fetching topic ID for "${topicName}":`, error);
    return null;
  }
};

// ✅ HELPER: Function to get topic ID from topic list by name
export const getTopicIdFromList = (topicList, topicName) => {
  const topic = topicList.find(
    t => t.topicName === topicName || t.name === topicName,
  );
  return topic?.id || null;
};

// Fetch submissions for a specific homework by Teacher
export const fetchSubmissionsForHomework = async (homeworkId, teacherEmail) => {
  try {
    if (!homeworkId || !teacherEmail) {
      throw new Error('Both homeworkId and teacherEmail are required');
    }

    console.log('🆔 [fetchSubmissionsForHomework] Homework ID:', homeworkId);
    const url = `${getSubmissionsForHomeworkUrl}?homeworkId=${encodeURIComponent(
      homeworkId,
    )}&teacherEmail=${encodeURIComponent(teacherEmail)}`;

    console.log('🔍 [fetchSubmissionsForHomework] Making request to:', url);

    const response = await authenticatedAPI(url, null, 'GET');

    console.log('✅ [fetchSubmissionsForHomework] Response:', response);

    // Normalize response (API might return [] or { data: [] })
    if (Array.isArray(response)) {
      return response;
    } else if (response?.data && Array.isArray(response.data)) {
      return response.data;
    } else if (response?.submissions && Array.isArray(response.submissions)) {
      return response.submissions;
    }

    console.warn(
      '⚠️ [fetchSubmissionsForHomework] Unexpected response format, returning empty array',
    );
    return [];
  } catch (error) {
    console.error('❌ [fetchSubmissionsForHomework] Error:', error);

    if (error.response?.status === 404 || error.response?.status === 500) {
      return [];
    }

    throw error;
  }
};

export const fetchAllClassRoomSubjectDetails = async (
  role,
  email,
  branchCode,
) => {
  try {
    if (!role || !email || !branchCode) {
      throw new Error('role, email, and branchCode are required');
    }

    const url = `${getAllClassRoomSubjectDetailsUrl}?role=${encodeURIComponent(
      role,
    )}&email=${encodeURIComponent(email)}&branchCode=${encodeURIComponent(
      branchCode,
    )}`;

    console.log('📋 [fetchAllClassRoomSubjectDetails] Request URL:', url);

    const response = await authenticatedAPI(url, null, 'GET');

    console.log('✅ [fetchAllClassRoomSubjectDetails] Response:', response);

    if (Array.isArray(response)) {
      return response;
    } else if (response?.data && Array.isArray(response.data)) {
      return response.data;
    }

    console.warn(
      '⚠️ [fetchAllClassRoomSubjectDetails] Unexpected format:',
      response,
    );
    return [];
  } catch (error) {
    console.error('❌ [fetchAllClassRoomSubjectDetails] Error:', error.message);
    return [];
  }
};

// ── PUT: Update classroom subject details ──
// API: PUT /updateClassRoomSubjectDetails/{id}?role=teacher&email=...
// Payload: { classroom: {id}, subject: {id}, examType: {id}, paperType: {id},
//            passingMarks, totalMarks, topicName }
export const updateClassRoomSubjectDetails = async (
  id,
  role,
  email,
  payload,
) => {
  try {
    if (!id || !role || !email || !payload) {
      throw new Error('id, role, email, and payload are required');
    }

    const url = `${updateClassRoomSubjectDetailsUrl}/${id}?role=${encodeURIComponent(
      role,
    )}&email=${encodeURIComponent(email)}`;

    console.log('✏️ [updateClassRoomSubjectDetails] Request URL:', url);
    console.log('📦 [updateClassRoomSubjectDetails] Payload:', payload);

    const response = await authenticatedAPI(url, payload, 'PUT');

    console.log('✅ [updateClassRoomSubjectDetails] Response:', response);

    return response;
  } catch (error) {
    console.error('❌ [updateClassRoomSubjectDetails] Error:', error.message);
    throw error;
  }
};

// Fetch Institute Details by instituteEmail
// ⚠️  Always pass userData.instituteEmail (e.g. "Testing@gmail.com"),
//     NOT the teacher's own login email (e.g. "akash@gmail.com").
//     The login response contains both: response.data.email (teacher)
//     and response.data.instituteEmail (institute owner).
export const getInstituteDetailsApi = async instituteEmail => {
  try {
    if (!instituteEmail) {
      throw new Error('Institute email is required');
    }

    const url = `${getInstituteDetailsUrl}?instituteEmail=${encodeURIComponent(
      instituteEmail,
    )}`;

    console.log('🏫 [getInstituteDetailsApi] Request URL:', url);

    const response = await authenticatedAPI(url, null, 'GET');

    console.log('✅ [getInstituteDetailsApi] Response:', response);

    // API returns an array — pick the first item
    if (Array.isArray(response) && response.length > 0) {
      return response[0];
    } else if (
      response &&
      typeof response === 'object' &&
      !Array.isArray(response)
    ) {
      return response;
    }

    return null;
  } catch (error) {
    console.error('❌ [getInstituteDetailsApi] Error:', error.message);
    return null; // Return null gracefully so dashboard doesn't crash
  }
};
///////////////////////////////////////// STUDENT API FROM HERE///////////////////////////////////

// Updated loginStudent function in Apicall.js
export const loginStudent = async (email, password) => {
  try {
    const response = await publicAPI(
      LoginUrlByStudent,
      {email, password},
      'POST',
    );

    console.log('🔍 Raw login response:', response);

    if (response.token) {
      await AsyncStorage.setItem('userToken', response.token);

      const role = 'user';
      await AsyncStorage.setItem('userRole', role);

      await AsyncStorage.setItem('userData', JSON.stringify(response));

      // Preserve full student response so downstream screens can access classroom fields
      const studentData = {
        ...response,
        formId: response.id,
        admissionId: response.id,
      };

      await AsyncStorage.setItem('studentData', JSON.stringify(studentData));
      console.log('✅ Stored student data (full response):', studentData);

      return {
        token: response.token,
        role,
        studentData,
      };
    } else {
      throw new Error('Token missing in response');
    }
  } catch (error) {
    console.error(
      'Student login failed:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const fetchAttendanceCountByFormId = async ({
  formId,
  admissionId,
  filter = 'today',
  branchCode,
  fromDate = null,
  toDate = null,
}) => {
  if (!formId || !admissionId || !branchCode) {
    throw new Error('formId, admissionId, and branchCode are required');
  }

  try {
    let url = `${getAttendanceCountByFormIdUrl}/${formId}?admissionId=${encodeURIComponent(
      admissionId,
    )}&filter=${encodeURIComponent(filter)}&branchCode=${encodeURIComponent(
      branchCode,
    )}`;

    // 👇 Use correct query param names based on API
    if (fromDate) {
      url += `&startDate=${encodeURIComponent(fromDate)}`;
    }
    if (toDate) {
      url += `&endDate=${encodeURIComponent(toDate)}`;
    }

    console.log('🔍 [fetchAttendanceCountByFormId] Making request to:', url);

    const response = await authenticatedAPI(url, null, 'GET');

    console.log('✅ [fetchAttendanceCountByFormId] Response:', response);

    return {
      ...response,
      totalDays:
        response?.totalDays ??
        (typeof response?.presentCount === 'number' &&
        typeof response?.absentCount === 'number'
          ? response.presentCount + response.absentCount
          : 0),
    };
  } catch (error) {
    console.error('❌ Error in fetchAttendanceCountByFormId:', error);
    throw error;
  }
};

// Get User Result by Student ID
export const fetchUserResultByStudentId = async studentId => {
  try {
    if (!studentId) {
      throw new Error('Student ID is required');
    }

    const url = `${getUserResultUrl}/${studentId}`;
    console.log('🔍 Fetching user result from URL:', url);

    const response = await authenticatedAPI(url, null, 'GET');
    console.log('✅ User result response:', response);

    return response;
  } catch (error) {
    console.error('❌ Error fetching user result:', error);
    throw error;
  }
};

// GET API fetching User by ID
export const getUserById = async (userId, email) => {
  try {
    if (!userId || !email) {
      throw new Error('userId and email are required');
    }

    // Construct API URL
    const url = `${getUserByIdUrl}/${encodeURIComponent(
      userId,
    )}?email=${encodeURIComponent(email)}`;
    console.log('🔗 [getUserById] Constructed URL:', url);

    // Make the API call
    const response = await authenticatedAPI(url, null, 'GET');
    console.log('📦 [getUserById] Raw response:', response);

    // Validate and return
    if (response && typeof response === 'object') {
      return {success: true, data: response};
    } else {
      console.warn('⚠️ [getUserById] Unexpected response format:', response);
      return {success: true, data: {}};
    }
  } catch (error) {
    console.error('❌ [getUserById] ERROR:', error.message);
    return {success: false, error: error.message, data: {}};
  }
};

// Fetch single student result by studentId
export const fetchStudentResultByTeacher = async (
  studentId,
  email,
  role = 'teacher',
) => {
  try {
    if (!studentId || !email) {
      throw new Error('Student ID and teacher email are required');
    }

    const url = `${getStudentResultUrl}/${encodeURIComponent(
      studentId,
    )}?role=${encodeURIComponent(role)}&email=${encodeURIComponent(email)}`;

    const response = await authenticatedAPI(url, null, 'GET');

    // Normalize response
    if (response && response.studentId) {
      return response;
    }

    console.warn('⚠️ Unexpected student result response:', response);
    return null;
  } catch (error) {
    console.error('❌ Error fetching student result:', error);
    throw error;
  }
};

// ✅ Fetch Homework / Assignments for a Student (Authenticated)
export const fetchHomeworkForStudent = async (studentEmailParam = null) => {
  try {
    // Get student email dynamically if not provided
    let studentEmail = studentEmailParam;
    if (!studentEmail) {
      const storedData = await AsyncStorage.getItem('studentData');
      if (storedData) {
        const parsed = JSON.parse(storedData);
        studentEmail = parsed?.email;
      }
    }

    if (!studentEmail) {
      throw new Error('Student email not found. Please login again.');
    }

    // ✅ Get auth token
    const role = await AsyncStorage.getItem('userRole');
    const token =
      (await AsyncStorage.getItem(`${role}Token`)) ||
      (await AsyncStorage.getItem('userToken'));

    if (!token) {
      throw new Error('Authentication required. Please login again.');
    }

    // Construct URL
    const url = `${getHomeworkForStudentUrl}?studentEmail=${encodeURIComponent(
      studentEmail,
    )}`;
    console.log('📡 [fetchHomeworkForStudent] Fetching from:', url);

    // Fetch with Bearer token
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    // Handle unauthorized or error responses
    if (!response.ok) {
      const text = await response.text();
      console.error('❌ [fetchHomeworkForStudent] API Error Response:', text);
      if (response.status === 401) {
        throw new Error('Your session has expired. Please login again.');
      }
      throw new Error(
        text || `Failed to fetch homework (status: ${response.status})`,
      );
    }

    // Parse valid response
    const result = await response.json();

    if (Array.isArray(result)) return result;
    if (result?.data && Array.isArray(result.data)) return result.data;
    if (result?.homework && Array.isArray(result.homework))
      return result.homework;

    return [];
  } catch (error) {
    console.error('❌ [fetchHomeworkForStudent] Error:', error.message);
    throw new Error(
      error.message || 'Failed to load homework. Please try again later.',
    );
  }
};

// Fetch Homework/Assignment by Teacher and Class
export const fetchHomeworkByTeacherAndClass = async (classId, teacherEmail) => {
  try {
    if (!classId || !teacherEmail) {
      throw new Error('Both classId and teacherEmail are required');
    }

    const url = `${homeworkByTeacherAndClassUrl}?classId=${encodeURIComponent(
      classId,
    )}&teacherEmail=${encodeURIComponent(teacherEmail)}`;

    console.log('🔍 [fetchHomeworkByTeacherAndClass] Making request to:', url);

    // Use authenticated API helper
    const response = await authenticatedAPI(url, null, 'GET');

    console.log('✅ [fetchHomeworkByTeacherAndClass] Response:', response);

    // Normalize response
    if (Array.isArray(response)) {
      return response;
    } else if (response?.data && Array.isArray(response.data)) {
      return response.data;
    } else if (response?.homework && Array.isArray(response.homework)) {
      return response.homework;
    }

    console.warn(
      '⚠️ [fetchHomeworkByTeacherAndClass] Unexpected response format, returning empty array',
    );
    return [];
  } catch (error) {
    console.error('❌ [fetchHomeworkByTeacherAndClass] Error:', error);

    // Return empty array for 404 or server errors to avoid app crash
    if (error.response?.status === 404 || error.response?.status === 500) {
      return [];
    }

    throw error;
  }
};

// POST API to assign homework/assignment by Teacher
export const assignHomework = async (payload, isFormData = false) => {
  try {
    if (!payload) {
      throw new Error('Payload is required');
    }

    const token = await AsyncStorage.getItem('teacherToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('🚀 [assignHomework] Making request to:', assignHomeworkUrl);

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    let body;

    // Handle FormData (for file uploads) vs regular JSON
    if (isFormData) {
      // Don't set Content-Type for FormData, let the browser set it with boundary
      body = payload;
      console.log('📦 [assignHomework] Using FormData for file upload');
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(payload);
      console.log('📦 [assignHomework] Using JSON payload:', payload);
    }

    const response = await fetch(assignHomeworkUrl, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [assignHomework] API Error Response:', errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ [assignHomework] Response:', result);
    return result;
  } catch (error) {
    console.error('❌ [assignHomework] Error:', error);
    throw error;
  }
};

// Alternative function specifically for file uploads with FormData
export const assignHomeworkWithFile = async formData => {
  try {
    const token = await AsyncStorage.getItem('teacherToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('🚀 [assignHomeworkWithFile] Uploading assignment with file');

    const response = await fetch(assignHomeworkUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        // Don't set Content-Type for FormData - let React Native handle it
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        '❌ [assignHomeworkWithFile] API Error Response:',
        errorText,
      );
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ [assignHomeworkWithFile] Response:', result);
    return result;
  } catch (error) {
    console.error('❌ [assignHomeworkWithFile] Error:', error);
    throw error;
  }
};

export const sendOtp = async email => {
  try {
    console.log('[sendOtp] Sending OTP to:', email);

    const response = await fetch(sendOtpUrl, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email}),
    });

    // Check Content-Type header
    const contentType = response.headers.get('content-type') || '';

    let data;
    if (contentType.includes('application/json')) {
      data = await response.json(); // parse JSON if JSON
    } else {
      const text = await response.text(); // otherwise treat as plain text
      data = {success: response.ok, message: text};
    }

    console.log('[sendOtp] Response:', data);
    return data;
  } catch (error) {
    console.error('[sendOtp] Error:', error);
    throw error;
  }
};

// Reset Student Password
export const resetUserPassword = async ({email, newPassword, otp}) => {
  try {
    console.log('[resetUserPassword] Sending request with:', {
      email,
      newPassword,
      otp,
    });

    const response = await fetch(resetUserPasswordUrl, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email, newPassword, otp}),
    });

    const contentType = response.headers.get('content-type') || '';
    let data;

    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = {success: response.ok, message: text};
    }

    console.log('[resetUserPassword] Response:', data);
    return data;
  } catch (error) {
    console.error('[resetUserPassword] Error:', error);
    throw error;
  }
};

// ✅ Fetch Timetable by ClassRoomId for Student
export const fetchTimetableByClassRoomId = async (
  classRoomId,
  role = 'student',
  email,
) => {
  try {
    if (!classRoomId || !email) {
      throw new Error('classRoomId and email are required');
    }

    // Construct API URL
    const url = `${getTimetableByClassRoomIdUrl}?classRoomId=${encodeURIComponent(
      classRoomId,
    )}&role=${encodeURIComponent(role)}&email=${encodeURIComponent(email)}`;

    console.log('📅 [fetchTimetableByClassRoomId] Request URL:', url);

    // Use authenticated API helper
    const response = await authenticatedAPI(url, null, 'GET');

    console.log('✅ [fetchTimetableByClassRoomId] Response:', response);

    // Normalize response
    if (Array.isArray(response)) {
      return response;
    } else if (response?.data && Array.isArray(response.data)) {
      return response.data;
    } else if (response?.timetable && Array.isArray(response.timetable)) {
      return response.timetable;
    }

    console.warn(
      '⚠️ [fetchTimetableByClassRoomId] Unexpected response format:',
      response,
    );
    return [];
  } catch (error) {
    console.error('❌ [fetchTimetableByClassRoomId] Error:', error.message);
    return [];
  }
};

export const submitHomeworkApi = async (url, formData) => {
  try {
    // ✅ Correct key — student token is stored as 'userToken' at login
    const token = await AsyncStorage.getItem('userToken');

    if (!token) {
      console.warn(
        '⚠️ [submitHomeworkApi] No token found. User may not be logged in.',
      );
      return {
        success: false,
        message: 'Authentication token not found. Please log in again.',
      };
    }

    console.log('📤 [submitHomeworkApi] Posting to:', url);

    const response = await axios({
      method: 'POST',
      url,
      data: formData,
      headers: {
        Authorization: `Bearer ${token}`,
        // ✅ Do NOT manually set Content-Type for FormData —
        //    axios sets it automatically with the correct boundary.
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('✅ [submitHomeworkApi] Response:', response.data);

    return {
      success: true,
      data: response.data,
      message: response.data?.message || 'Submitted successfully',
    };
  } catch (error) {
    console.error(
      '❌ [submitHomeworkApi] Error:',
      error?.response?.data || error.message,
    );

    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error.message ||
        'Something went wrong',
      data: error?.response?.data,
    };
  }
};

//////////////////////////////////parent API from here///////////////////////////////////////

// -------------------- SEND OTP FOR PARENT --------------------
export const sendOtpParent = async email => {
  try {
    const response = await fetch(sendOtpParentUrl, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({parentEmail: email}), // backend expects parentEmail
    });

    const contentType = response.headers.get('content-type') || '';
    let data;

    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      // Convert plain text to a standard object
      data = {success: response.ok, message: text};
    }

    console.log('[sendOtpParent] Response:', data);
    return data;
  } catch (error) {
    console.error('[sendOtpParent] Error:', error);
    return {success: false, message: error.message || 'OTP failed'};
  }
};

// ✅ FIXED resetParentPassword function
export const resetParentPassword = async (parentEmail, newPassword, otp) => {
  try {
    const payload = {parentEmail, newPassword, otp};
    const response = await fetch(resetParentPasswordUrl, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload),
    });

    const text = await response.text(); // backend returns plain text, not JSON
    console.log('🔍 [resetParentPassword] Raw response:', text);

    if (!response.ok) {
      throw new Error(text || 'Failed to reset password');
    }

    // try to parse if backend sometimes sends JSON
    try {
      const json = JSON.parse(text);
      return json;
    } catch {
      // fallback if plain text
      return {
        success: text.toLowerCase().includes('success'),
        message: text,
      };
    }
  } catch (error) {
    console.error('❌ [resetParentPassword] Error:', error);
    throw new Error(error.message || 'Password reset failed');
  }
};

// -------------------- PARENT LOGIN --------------------
export const parentLogin = async (email, password) => {
  try {
    const response = await fetch(LoginUrlByParent, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({parentEmail: email, password}),
    });

    const contentType = response.headers.get('content-type') || '';
    let data;

    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = {success: response.ok, message: text};
    }

    // Save token and role if login successful
    if (data.success && data.token) {
      await AsyncStorage.setItem('userToken', data.token);
      await AsyncStorage.setItem('parentToken', data.token);
      await AsyncStorage.setItem('userRole', 'parent');
      if (data.userData) {
        await AsyncStorage.setItem('userData', JSON.stringify(data.userData));
      }
    }

    console.log('[parentLogin] Response:', data);
    return data;
  } catch (error) {
    console.error('[parentLogin] Error:', error);
    return {success: false, message: error.message || 'Login failed'};
  }
};
