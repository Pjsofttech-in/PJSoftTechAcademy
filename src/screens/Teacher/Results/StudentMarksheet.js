import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Dimensions,
  Platform,
  PermissionsAndroid,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {fetchStudentResultByTeacher} from '../../../util/Apicall';
import {useAuth} from '../../../auth/AuthContext';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNFS from 'react-native-fs';
import TeacherHeader from '../../../components/TeacherComponent/TeacherHeader';
import TeacherFooter from '../../../components/TeacherComponent/TeacherFooter';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
const isTablet = screenWidth >= 768;

const StudentMarksheet = ({route, navigation}) => {
  const {studentId} = route.params || {};
  const {userData} = useAuth();

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [marksheetData, setMarksheetData] = useState(null);

  useEffect(() => {
    if (studentId && userData?.email) {
      fetchStudentData();
    }
  }, [studentId, userData?.email]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const response = await fetchStudentResultByTeacher(
        studentId,
        userData.email,
        'teacher',
      );

      if (response) {
        setMarksheetData(response);
      } else {
        Alert.alert('Error', 'No data found for this student');
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
      Alert.alert('Error', 'Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate individual subject percentages and overall status
  const calculateSubjectPercentages = subjectResults => {
    return subjectResults.map(subject => {
      const percentage =
        subject.totalMarks > 0
          ? ((subject.obtainedMarks / subject.totalMarks) * 100).toFixed(2)
          : '0.00';
      const status =
        subject.obtainedMarks >= subject.passingMarks ? 'PASS' : 'FAIL';
      return {
        ...subject,
        percentage,
        status,
      };
    });
  };

  // Request storage permission
  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        if (Platform.Version >= 33) {
          return true;
        }
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission Required',
            message: 'App needs access to your storage to download PDF',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Permission error:', err);
        return false;
      }
    }
    return true;
  };

  // Generate HTML content for PDF
  const generatePDFHTML = () => {
    if (!marksheetData) return '';

    const subjectsWithPercentages = calculateSubjectPercentages(
      marksheetData.subjectResults || [],
    );
    const overallStatus = marksheetData.status || 'Unknown';

    const tableRows = subjectsWithPercentages
      .map(
        (subject, index) => `
        <tr style="${index % 2 === 0 ? 'background-color: #f9f9f9;' : ''}">
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-size: 12px;">${
            subject.subjectName || '--'
          }</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-size: 12px;">${
            subject.topicName || '--'
          }</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-size: 12px;">${
            subject.examType || '--'
          }</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-size: 12px;">${
            subject.paperType || '--'
          }</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-size: 12px; font-weight: bold;">${
            subject.obtainedMarks || 0
          }</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-size: 12px;">${
            subject.totalMarks || 0
          }</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-size: 12px;">${
            subject.passingMarks || 0
          }</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-size: 12px; font-weight: bold;">${
            subject.percentage
          }%</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-size: 12px; color: ${
            subject.status === 'PASS' ? '#2E7D32' : '#C62828'
          }; font-weight: bold;">${subject.status}</td>
        </tr>
      `,
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Academic Result - ${marksheetData.studentName}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body { 
            font-family: 'Arial', sans-serif; 
            margin: 20px; 
            background-color: #fff;
            color: #333;
          }
          
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 3px solid #000; 
            padding-bottom: 20px; 
          }
          
          .header h1 {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .student-info { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 30px; 
            background-color: #f8f9fa;
            padding: 20px;
            border: 2px solid #000;
          }
          
          .info-left, .info-right { 
            width: 48%; 
          }
          
          .info-row { 
            margin-bottom: 8px; 
            font-size: 14px;
          }
          
          .info-label {
            font-weight: bold;
            display: inline-block;
            width: 120px;
          }
          
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 30px; 
            border: 2px solid #000;
          }
          
          th { 
            background-color: #000; 
            color: white;
            padding: 12px 8px; 
            border: 1px solid #000; 
            text-align: center; 
            font-weight: bold; 
            font-size: 12px;
          }
          
          td {
            padding: 10px 8px;
            border: 1px solid #ddd;
            text-align: center;
            font-size: 12px;
          }
          
          .grand-total { 
            background-color: #f0f0f0 !important; 
            font-weight: bold; 
            border-top: 2px solid #000;
          }
          
          .grand-total td {
            font-weight: bold;
            font-size: 13px;
            border: 1px solid #000;
          }
          
          .performance-summary { 
            margin-top: 30px; 
            padding: 20px; 
            background-color: #f8f9fa; 
            border: 2px solid #000;
          }
          
          .performance-summary h3 {
            font-size: 16px;
            margin-bottom: 15px;
            text-align: center;
            font-weight: bold;
          }
          
          .summary-row {
            margin-bottom: 8px;
            font-size: 14px;
            display: flex;
            justify-content: space-between;
          }
          
          .signatures { 
            display: flex; 
            justify-content: space-between; 
            margin-top: 50px; 
            padding-top: 30px;
          }
          
          .signature { 
            text-align: center; 
            width: 30%; 
          }
          
          .signature-line { 
            border-top: 2px solid #000; 
            padding-top: 10px; 
            margin-top: 40px; 
            font-size: 12px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ACADEMIC RESULT - ${
            marksheetData.academicYear || '2025-2026'
          }</h1>
        </div>
        
        <div class="student-info">
          <div class="info-left">
            <div class="info-row">
              <span class="info-label">Student Name:</span> ${
                marksheetData.studentName || '--'
              }
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span> ${
                marksheetData.email || '--'
              }
            </div>
            <div class="info-row">
              <span class="info-label">Course:</span> ${
                marksheetData.coursename || '--'
              }
            </div>
          </div>
          <div class="info-right">
            <div class="info-row">
              <span class="info-label">Medium:</span> ${
                marksheetData.mediumName || '--'
              }
            </div>
            <div class="info-row">
              <span class="info-label">Batch:</span> ${
                marksheetData.batchName || '--'
              }
            </div>
            <div class="info-row">
              <span class="info-label">Academic Year:</span> ${
                marksheetData.academicYear || '--'
              }
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Subject</th>
              <th>Topic</th>
              <th>Exam Type</th>
              <th>Paper Type</th>
              <th>Obtained</th>
              <th>Total</th>
              <th>Passing</th>
              <th>Percentage</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
            <tr class="grand-total">
              <td colspan="4" style="text-align: center; font-weight: bold;">GRAND TOTAL</td>
              <td>${marksheetData.totalObtainedMarks || 0}</td>
              <td>${marksheetData.totalSubjectMarks || 0}</td>
              <td>-</td>
              <td>${
                marksheetData.percentage
                  ? marksheetData.percentage.toFixed(2)
                  : '0.00'
              }%</td>
              <td style="color: ${
                overallStatus === 'Pass' ? '#2E7D32' : '#C62828'
              };">${overallStatus.toUpperCase()}</td>
            </tr>
          </tbody>
        </table>

        <div class="performance-summary">
          <h3>Performance Summary</h3>
          <div class="summary-row">
            <span><strong>Total Obtained Marks:</strong></span>
            <span>${marksheetData.totalObtainedMarks || 0} / ${
      marksheetData.totalSubjectMarks || 0
    }</span>
          </div>
          <div class="summary-row">
            <span><strong>Percentage:</strong></span>
            <span>${
              marksheetData.percentage
                ? marksheetData.percentage.toFixed(2)
                : '0.00'
            }%</span>
          </div>
          <div class="summary-row">
            <span><strong>Result Status:</strong></span>
            <span style="color: ${
              overallStatus === 'Pass' ? '#2E7D32' : '#C62828'
            }; font-weight: bold;">${overallStatus.toUpperCase()}</span>
          </div>
          <div class="summary-row">
            <span><strong>Result Date:</strong></span>
            <span>${marksheetData.resultDate || '--'}</span>
          </div>
        </div>

        <div class="signatures">
          <div class="signature">
            <div class="signature-line">Class Teacher</div>
          </div>
          <div class="signature">
            <div class="signature-line">Principal</div>
          </div>
          <div class="signature">
            <div class="signature-line">Parent/Guardian</div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Download PDF function
  const downloadPDF = async () => {
    try {
      setIsDownloading(true);

      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Storage permission is required to download PDF',
        );
        setIsDownloading(false);
        return;
      }

      const htmlContent = generatePDFHTML();
      const timestamp = new Date().toISOString().slice(0, 10);
      const fileName = `Marksheet_${marksheetData.studentName.replace(
        /[^a-zA-Z0-9]/g,
        '_',
      )}_${timestamp}`;

      const options = {
        html: htmlContent,
        fileName: fileName,
        directory: 'Documents', // temp sandbox directory
        width: 595,
        height: 842,
        padding: 20,
        bgColor: '#FFFFFF',
      };

      const pdf = await RNHTMLtoPDF.convert(options);

      if (pdf && pdf.filePath) {
        const fileExists = await RNFS.exists(pdf.filePath);

        if (fileExists) {
          let finalPath = pdf.filePath;

          // ✅ Move to real Downloads on Android
          if (Platform.OS === 'android') {
            const downloadDest = `${RNFS.DownloadDirectoryPath}/${fileName}.pdf`;
            await RNFS.moveFile(pdf.filePath, downloadDest);
            finalPath = downloadDest;
          }

          Alert.alert(
            'PDF Downloaded Successfully!',
            `File saved to:\n${finalPath}`,
            [
              {
                text: 'OK',
                onPress: () => setShowModal(false),
              },
            ],
          );
        } else {
          throw new Error('PDF file was not created successfully');
        }
      } else {
        throw new Error('Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', `Failed to generate PDF: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  // Marksheet Component
  const MarksheetComponent = ({isModal = false}) => {
    if (!marksheetData) return null;

    const subjectsWithPercentages = calculateSubjectPercentages(
      marksheetData.subjectResults || [],
    );

    return (
      <View
        style={[styles.marksheetContainer, isModal && styles.modalMarksheet]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            ACADEMIC RESULT - {marksheetData.academicYear || '2025-2026'}
          </Text>
        </View>

        {/* Student Info */}
        <View style={styles.studentInfo}>
          <View style={styles.infoLeft}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Student Name:</Text>
              <Text style={styles.infoValue}>
                {marksheetData.studentName || '--'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>
                {marksheetData.email || '--'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Course:</Text>
              <Text style={styles.infoValue}>
                {marksheetData.coursename || '--'}
              </Text>
            </View>
          </View>
          <View style={styles.infoRight}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Medium:</Text>
              <Text style={styles.infoValue}>
                {marksheetData.mediumName || '--'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Batch:</Text>
              <Text style={styles.infoValue}>
                {marksheetData.batchName || '--'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Academic Year:</Text>
              <Text style={styles.infoValue}>
                {marksheetData.academicYear || '--'}
              </Text>
            </View>
          </View>
        </View>

        {/* Results Table */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, {width: 80}]}>Subject</Text>
              <Text style={[styles.headerCell, {width: 80}]}>Topic</Text>
              <Text style={[styles.headerCell, {width: 80}]}>Exam Type</Text>
              <Text style={[styles.headerCell, {width: 80}]}>Paper Type</Text>
              <Text style={[styles.headerCell, {width: 70}]}>Obtained</Text>
              <Text style={[styles.headerCell, {width: 70}]}>Total</Text>
              <Text style={[styles.headerCell, {width: 70}]}>Passing</Text>
              <Text style={[styles.headerCell, {width: 80}]}>%</Text>
              <Text style={[styles.headerCell, {width: 70}]}>Status</Text>
            </View>

            {/* Table Rows */}
            {subjectsWithPercentages.map((subject, index) => (
              <View
                key={index}
                style={[styles.tableRow, index % 2 === 0 && styles.evenRow]}>
                <Text style={[styles.cell, {width: 80}]}>
                  {subject.subjectName || '--'}
                </Text>
                <Text style={[styles.cell, {width: 80}]}>
                  {subject.topicName || '--'}
                </Text>
                <Text style={[styles.cell, {width: 80}]}>
                  {subject.examType || '--'}
                </Text>
                <Text style={[styles.cell, {width: 80}]}>
                  {subject.paperType || '--'}
                </Text>
                <Text style={[styles.cell, {width: 70}, styles.boldText]}>
                  {subject.obtainedMarks || 0}
                </Text>
                <Text style={[styles.cell, {width: 70}]}>
                  {subject.totalMarks || 0}
                </Text>
                <Text style={[styles.cell, {width: 70}]}>
                  {subject.passingMarks || 0}
                </Text>
                <Text style={[styles.cell, {width: 80}, styles.boldText]}>
                  {subject.percentage}%
                </Text>
                <Text
                  style={[
                    styles.cell,
                    {width: 70},
                    subject.status === 'PASS'
                      ? styles.passText
                      : styles.failText,
                    styles.boldText,
                  ]}>
                  {subject.status}
                </Text>
              </View>
            ))}

            {/* Grand Total Row */}
            <View style={[styles.tableRow, styles.grandTotalRow]}>
              <Text style={[styles.cell, {width: 320}, styles.grandTotalText]}>
                GRAND TOTAL
              </Text>
              <Text style={[styles.cell, {width: 70}, styles.grandTotalText]}>
                {marksheetData.totalObtainedMarks || 0}
              </Text>
              <Text style={[styles.cell, {width: 70}, styles.grandTotalText]}>
                {marksheetData.totalSubjectMarks || 0}
              </Text>
              <Text style={[styles.cell, {width: 70}, styles.grandTotalText]}>
                -
              </Text>
              <Text style={[styles.cell, {width: 80}, styles.grandTotalText]}>
                {marksheetData.percentage
                  ? marksheetData.percentage.toFixed(2)
                  : '0.00'}
                %
              </Text>
              <Text
                style={[
                  styles.cell,
                  {width: 70},
                  styles.grandTotalText,
                  marksheetData.status === 'Pass'
                    ? styles.passText
                    : styles.failText,
                ]}>
                {(marksheetData.status || 'Unknown').toUpperCase()}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Performance Summary */}
        <View style={styles.performanceSummary}>
          <Text style={styles.summaryTitle}>Performance Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Obtained Marks:</Text>
            <Text style={styles.summaryValue}>
              {marksheetData.totalObtainedMarks || 0} /{' '}
              {marksheetData.totalSubjectMarks || 0}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Percentage:</Text>
            <Text style={styles.summaryValue}>
              {marksheetData.percentage
                ? marksheetData.percentage.toFixed(2)
                : '0.00'}
              %
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Result Status:</Text>
            <Text
              style={[
                styles.summaryValue,
                marksheetData.status === 'Pass'
                  ? styles.passText
                  : styles.failText,
                styles.boldText,
              ]}>
              {(marksheetData.status || 'Unknown').toUpperCase()}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Result Date:</Text>
            <Text style={styles.summaryValue}>
              {marksheetData.resultDate || '--'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading Student Data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!marksheetData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>No data found for this student</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TeacherHeader />
      <ScrollView style={styles.scrollView}>
        <MarksheetComponent />

        {/* Download Button */}
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={() => setShowModal(true)}
          disabled={isDownloading}>
          <Ionicons name="download-outline" size={20} color="white" />
          <Text style={styles.downloadButtonText}>Download Report Card</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal for PDF Preview and Download */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowModal(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowModal(false)}
              style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Report Card Preview</Text>
            <TouchableOpacity
              onPress={downloadPDF}
              style={styles.pdfDownloadButton}
              disabled={isDownloading}>
              {isDownloading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons
                    name="document-text-outline"
                    size={18}
                    color="white"
                  />
                  <Text style={styles.pdfButtonText}>PDF</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <MarksheetComponent isModal={true} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
      <TeacherFooter />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#DC2626',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  marksheetContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: isTablet ? 20 : 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  modalMarksheet: {
    margin: 10,
    borderRadius: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 25,
    borderBottomWidth: 3,
    borderBottomColor: '#000',
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: isTablet ? 22 : 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  studentInfo: {
    flexDirection: isTablet ? 'row' : 'column',
    marginBottom: 25,
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 5,
  },
  infoLeft: {
    flex: 1,
    marginRight: isTablet ? 15 : 0,
  },
  infoRight: {
    flex: 1,
    marginTop: isTablet ? 0 : 10,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  infoLabel: {
    fontWeight: 'bold',
    fontSize: isTablet ? 14 : 12,
    width: 120,
  },
  infoValue: {
    fontSize: isTablet ? 14 : 12,
    flex: 1,
  },
  table: {
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 5,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#000',
  },
  headerCell: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: isTablet ? 12 : 10,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderRightColor: '#333',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: 'white',
  },
  evenRow: {
    backgroundColor: '#f9f9f9',
  },
  cell: {
    fontSize: isTablet ? 11 : 9,
    textAlign: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderRightColor: '#ddd',
  },
  boldText: {
    fontWeight: 'bold',
  },
  passText: {
    color: '#2E7D32',
  },
  failText: {
    color: '#C62828',
  },
  grandTotalRow: {
    backgroundColor: '#f0f0f0',
    borderTopWidth: 2,
    borderTopColor: '#000',
  },
  grandTotalText: {
    fontWeight: 'bold',
    fontSize: isTablet ? 12 : 10,
  },
  performanceSummary: {
    marginTop: 25,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 5,
  },
  summaryTitle: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: '600',
    flex: 1,
  },
  summaryValue: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  downloadButton: {
    backgroundColor: '#1976d2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  downloadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    elevation: 2,
  },
  closeButton: {
    padding: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  pdfDownloadButton: {
    backgroundColor: '#d32f2f',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  pdfButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  modalContent: {
    flex: 1,
  },
});

export default StudentMarksheet;
