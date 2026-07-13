import api from './api';

export const fetchReport = async (type = 'daily', params = {}) => {
  try {
    const response = await api.get(`/reports/${type}`, { params });
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch report');
  }
};

export const downloadReport = async (type = 'daily', format = 'excel', params = {}) => {
  try {
    const response = await api.get(`/reports/${type}`, {
      params: { ...params, format },
      responseType: 'blob', // Important for downloading files
    });

    // Create a URL for the blob and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Guess extension based on format
    const extension = format === 'excel' ? 'xlsx' : 'pdf';
    
    // Attempt to extract filename from content-disposition header if available
    const contentDisposition = response.headers['content-disposition'];
    let filename = `report.${extension}`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch && filenameMatch.length === 2) {
        filename = filenameMatch[1];
      }
    }

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download Error:', error);
    throw new Error('Failed to download report file');
  }
};
