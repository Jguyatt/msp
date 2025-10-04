import AWS from 'aws-sdk';
import { testEnvironmentVariables } from '../utils/envTest';
import { extractContractClauses, extractContractClausesWithPricing } from './clauseExtractionService';
import { supabase } from '../lib/supabase';

// Configure AWS SDK with proper error handling
const getS3Config = () => {
  const config = {
    region: process.env.REACT_APP_AWS_REGION || 'us-east-2'
  };

  // Add credentials from environment variables
  config.accessKeyId = process.env.REACT_APP_AWS_ACCESS_KEY_ID;
  config.secretAccessKey = process.env.REACT_APP_AWS_SECRET_ACCESS_KEY;

  console.log('AWS Config:', { 
    region: config.region, 
    accessKeyId: config.accessKeyId ? 'Set' : 'Missing',
    secretKey: config.secretAccessKey ? 'Set' : 'Missing'
  });

  return config;
};

const s3 = new AWS.S3(getS3Config());

export const awsUploadService = {
  // Upload a PDF file to AWS S3
  async uploadContractPDF(file, contractId, userId, companyId) {
    try {
      console.log('Starting AWS S3 PDF upload...');
      
      const envTest = testEnvironmentVariables();
      if (!envTest.bucket) {
        throw new Error('AWS S3 bucket name not configured. Please set REACT_APP_AWS_S3_BUCKET environment variable.');
      }
      
      console.log('Starting AWS S3 PDF upload:', { fileName: file.name, contractId, userId, companyId });
      
      const bucketName = process.env.REACT_APP_AWS_S3_BUCKET || 'renlu';
      console.log('Using bucket name:', bucketName);
      
      if (!bucketName) {
        throw new Error('AWS S3 bucket name not configured. Please set REACT_APP_AWS_S3_BUCKET environment variable.');
      }
      
      const fileExtension = file.name.split('.').pop();
      const fileName = `${userId}/${contractId}/contract.${fileExtension}`;
      
      const uploadParams = {
        Bucket: bucketName,
        Key: fileName,
        Body: file,
        ContentType: file.type,
        Metadata: {
          'contract-id': contractId,
          'user-id': userId,
          'company-id': companyId,
          'original-name': file.name,
          'upload-timestamp': new Date().toISOString()
        }
      };

      console.log('Uploading to S3 with params:', { 
        bucket: uploadParams.Bucket, 
        key: uploadParams.Key,
        contentType: uploadParams.ContentType 
      });

      const uploadResult = await s3.upload(uploadParams).promise();
      
      console.log('S3 upload successful:', uploadResult.Location);
      
      // Store the S3 URL in Supabase
      const { data, error } = await supabase
        .from('contracts')
        .update({ 
          s3_url: uploadResult.Location,
          updated_at: new Date().toISOString()
        })
        .eq('id', contractId);

      if (error) {
        console.error('Error updating contract with S3 URL:', error);
        // Don't throw here - the upload was successful, just the database update failed
      }

      return {
        success: true,
        url: uploadResult.Location,
        key: fileName
      };

    } catch (error) {
      console.error('AWS S3 upload error:', error);
      
      // Provide more specific error messages
      if (error.code === 'NoSuchBucket') {
        throw new Error(`S3 bucket '${process.env.REACT_APP_AWS_S3_BUCKET}' does not exist. Please check your bucket name.`);
      } else if (error.code === 'AccessDenied') {
        throw new Error('Access denied to S3 bucket. Please check your AWS credentials and bucket permissions.');
      } else if (error.code === 'InvalidAccessKeyId') {
        throw new Error('Invalid AWS access key. Please check your AWS credentials.');
      } else if (error.code === 'SignatureDoesNotMatch') {
        throw new Error('AWS signature mismatch. Please check your AWS secret key.');
      }
      
      throw new Error(`S3 upload failed: ${error.message}`);
    }
  },

  // Upload a generic file to AWS S3 (for templates, etc.)
  async uploadFile(file, userId, folder = 'uploads') {
    try {
      console.log('Starting AWS S3 file upload:', { fileName: file.name, userId, folder });
      
      const bucketName = process.env.REACT_APP_AWS_S3_BUCKET || 'renlu';
      console.log('Using bucket name:', bucketName);
      
      if (!bucketName) {
        return {
          success: false,
          error: 'AWS S3 bucket name not configured. Please set REACT_APP_AWS_S3_BUCKET environment variable.'
        };
      }
      
      const fileExtension = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${userId}/${folder}/${timestamp}-${file.name}`;
      
      const uploadParams = {
        Bucket: bucketName,
        Key: fileName,
        Body: file,
        ContentType: file.type,
        Metadata: {
          'user-id': userId,
          'folder': folder,
          'original-name': file.name,
          'upload-timestamp': new Date().toISOString()
        }
      };

      console.log('Uploading file to S3:', { 
        bucket: uploadParams.Bucket, 
        key: uploadParams.Key 
      });

      const uploadResult = await s3.upload(uploadParams).promise();
      
      console.log('File upload successful:', uploadResult.Location);
      
      return {
        success: true,
        url: uploadResult.Location,
        key: fileName
      };

    } catch (error) {
      console.error('AWS S3 file upload error:', error);
      
      // Provide more specific error messages
      if (error.code === 'NoSuchBucket') {
        return {
          success: false,
          error: `S3 bucket '${process.env.REACT_APP_AWS_S3_BUCKET}' does not exist. Please check your bucket name.`
        };
      } else if (error.code === 'AccessDenied') {
        return {
          success: false,
          error: 'Access denied to S3 bucket. Please check your AWS credentials and bucket permissions.'
        };
      } else if (error.code === 'InvalidAccessKeyId') {
        return {
          success: false,
          error: 'Invalid AWS access key. Please check your AWS credentials.'
        };
      } else if (error.code === 'SignatureDoesNotMatch') {
        return {
          success: false,
          error: 'AWS signature mismatch. Please check your AWS secret key.'
        };
      }
      
      return {
        success: false,
        error: `S3 upload failed: ${error.message}`
      };
    }
  },

  // Delete a file from AWS S3
  async deleteFile(filePath) {
    try {
      const bucketName = process.env.REACT_APP_AWS_S3_BUCKET || 'renlu';
      if (!bucketName) {
        throw new Error('AWS S3 bucket name not configured.');
      }
      
      // Extract key from S3 URL or use filePath as key
      const key = filePath.includes('amazonaws.com/') 
        ? filePath.split('amazonaws.com/')[1]
        : filePath;
      
      const deleteParams = {
        Bucket: bucketName,
        Key: key
      };

      await s3.deleteObject(deleteParams).promise();
      console.log('File deleted successfully:', key);
      
      return { success: true };
      
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  },

  // Test connection to AWS S3
  async testConnection() {
    try {
      const bucketName = process.env.REACT_APP_AWS_S3_BUCKET || 'renlu';
      console.log('Testing connection with bucket:', bucketName);

      // Try to list objects in the bucket (limited to 1 item for efficiency)
      const params = {
        Bucket: bucketName,
        MaxKeys: 1
      };

      await s3.listObjectsV2(params).promise();
      console.log('AWS S3 connection test successful');
      
      return {
        success: true,
        message: 'Successfully connected to AWS S3',
        bucket: bucketName
      };
      
    } catch (error) {
      console.error('AWS S3 connection test failed:', error);
      
      let errorMessage = 'Failed to connect to AWS S3';
      if (error.code === 'NoSuchBucket') {
        errorMessage = `S3 bucket '${process.env.REACT_APP_AWS_S3_BUCKET}' does not exist`;
      } else if (error.code === 'AccessDenied') {
        errorMessage = 'Access denied to S3 bucket. Check your AWS credentials';
      } else if (error.code === 'InvalidAccessKeyId') {
        errorMessage = 'Invalid AWS access key';
      } else if (error.code === 'SignatureDoesNotMatch') {
        errorMessage = 'AWS signature mismatch. Check your AWS secret key';
      }
      
      return {
        success: false,
        error: errorMessage,
        details: error.message
      };
    }
  }
};

export default awsUploadService;
