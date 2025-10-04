import { supabase } from '../lib/supabase';
import { extractContractClauses } from './clauseExtractionService';

export const fileUploadService = {
  // Upload a PDF file to Supabase Storage
  async uploadContractPDF(file, contractId, userId, companyId) {
    try {
      console.log('Starting PDF upload:', { fileName: file.name, contractId, userId, companyId });
      
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${contractId}_${Date.now()}.${fileExt}`;
      const filePath = `contracts/${companyId}/${fileName}`;
      
      // Try Supabase Storage first
      try {
        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('contract-files')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Supabase storage upload error:', uploadError);
          throw new Error(`Supabase upload failed: ${uploadError.message}`);
        }

        console.log('File uploaded to Supabase storage:', uploadData);

        // Get the public URL
        const { data: urlData } = supabase.storage
          .from('contract-files')
          .getPublicUrl(filePath);

        // Save file metadata to database
        const { data: fileRecord, error: dbError } = await supabase
          .from('contract_files')
          .insert([{
            company_id: companyId,
            user_id: userId,
            contract_id: contractId,
            original_name: file.name,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type
          }])
          .select()
          .single();

        if (dbError) {
          console.error('Database insert error:', dbError);
          // Try to clean up the uploaded file
          await supabase.storage
            .from('contract-files')
            .remove([filePath]);
          throw new Error(`Failed to save file metadata: ${dbError.message}`);
        }

        console.log('File record created:', fileRecord);

        // Extract clauses from the PDF
        let extractedClauses = null;
        try {
          console.log('Starting clause extraction...');
          extractedClauses = await extractContractClauses(file);
          
          // Save extracted clauses to database
          const { error: clausesError } = await supabase
            .from('contract_clauses')
            .insert([{
              contract_id: contractId,
              clauses_data: extractedClauses,
              extracted_at: new Date().toISOString()
            }]);

          if (clausesError) {
            console.warn('Failed to save extracted clauses:', clausesError);
          } else {
            console.log('Clauses extracted and saved successfully');
          }
        } catch (clauseError) {
          console.warn('Clause extraction failed:', clauseError);
          // Don't fail the entire upload if clause extraction fails
        }

        return {
          id: fileRecord.id,
          url: urlData.publicUrl,
          path: filePath,
          originalName: file.name,
          size: file.size,
          extractedClauses
        };

      } catch (supabaseError) {
        console.warn('Supabase storage failed, trying alternative approach:', supabaseError);
        
        // Fallback: Create a simple file record without storage
        // This allows the contract to be created even if file upload fails
        const { data: fileRecord, error: dbError } = await supabase
          .from('contract_files')
          .insert([{
            company_id: companyId,
            user_id: userId,
            contract_id: contractId,
            original_name: file.name,
            file_path: `fallback/${fileName}`, // Mark as fallback
            file_size: file.size,
            mime_type: file.type
          }])
          .select()
          .single();

        if (dbError) {
          console.error('Fallback database insert error:', dbError);
          throw new Error(`Failed to save file metadata: ${dbError.message}`);
        }

        console.log('Fallback file record created:', fileRecord);

        return {
          id: fileRecord.id,
          url: null, // No URL available
          path: `fallback/${fileName}`,
          originalName: file.name,
          size: file.size
        };
      }

    } catch (error) {
      console.error('Error uploading contract PDF:', error);
      throw error;
    }
  },

  // Get file download URL
  async getFileDownloadUrl(fileId) {
    try {
      const { data: fileRecord, error } = await supabase
        .from('contract_files')
        .select('file_path')
        .eq('id', fileId)
        .single();

      if (error) throw error;

      const { data } = supabase.storage
        .from('contract-files')
        .getPublicUrl(fileRecord.file_path);

      return data.publicUrl;
    } catch (error) {
      console.error('Error getting download URL:', error);
      throw error;
    }
  },

  // Delete a file
  async deleteFile(fileId) {
    try {
      // Get file record
      const { data: fileRecord, error: fetchError } = await supabase
        .from('contract_files')
        .select('file_path')
        .eq('id', fileId)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('contract-files')
        .remove([fileRecord.file_path]);

      if (storageError) {
        console.warn('Failed to delete from storage:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('contract_files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
};
