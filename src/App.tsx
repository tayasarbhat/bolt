import React, { useState, useRef } from 'react';
import { FileUp, FileCheck, Download, Heart } from 'lucide-react';

interface FileStats {
  totalFiles: number;
  totalRecords: number;
  duplicatesRemoved: number;
}

interface ProcessedChunk {
  data: string[];
  size: number;
}

function App() {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [stats, setStats] = useState<FileStats | null>(null);
  const [processedChunks, setProcessedChunks] = useState<ProcessedChunk[]>([]);
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    fetchRandomBackground();
  }, []);

  const fetchRandomBackground = async () => {
    try {
      const response = await fetch(
        'https://api.unsplash.com/photos/random?query=landscape,nature&orientation=landscape',
        {
          headers: {
            Authorization: 'Client-ID v7PaeqIlbJKzwBp67VUMQ91HKHyxBPwDDOLcCVl5KVM',
          },
        }
      );
      const data = await response.json();
      if (data?.urls?.full) {
        const imageUrl = `${data.urls.full}&w=${window.innerWidth}&q=80&fm=jpg&crop=entropy`;
        setBackgroundImage(imageUrl);
      }
    } catch (error) {
      console.error('Error fetching background image:', error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFiles(event.target.files);
    }
  };

  const processFiles = async () => {
    if (!selectedFiles) {
      alert('Please select at least one CSV file.');
      return;
    }

    const mergedData = new Set<string>();
    let totalRecords = 0;

    const readFiles = Array.from(selectedFiles).map(
      (file) =>
        new Promise<void>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const csvData = e.target?.result as string;
            const rows = csvData.split('\n').filter((row) => row.trim() !== '');
            totalRecords += rows.length - 1; // Exclude header

            for (let i = 1; i < rows.length; i++) {
              let value = rows[i].trim();
              if (value.startsWith('0')) {
                value = value.substring(1);
              }
              value = '971' + value;
              mergedData.add(value);
            }
            resolve();
          };
          reader.onerror = reject;
          reader.readAsText(file);
        })
    );

    try {
      await Promise.all(readFiles);
      const uniqueData = Array.from(mergedData);
      const duplicatesRemoved = totalRecords - uniqueData.length;

      setStats({
        totalFiles: selectedFiles.length,
        totalRecords,
        duplicatesRemoved,
      });

      // Split data into chunks of 9000
      const chunkSize = 9000;
      const chunks: ProcessedChunk[] = [];
      for (let i = 0; i < uniqueData.length; i += chunkSize) {
        const chunk = uniqueData.slice(i, i + chunkSize);
        chunks.push({
          data: chunk,
          size: new Blob([chunk.join('\n')], { type: 'text/csv' }).size,
        });
      }
      setProcessedChunks(chunks);
    } catch (error) {
      console.error('Error reading files:', error);
      alert('Error processing files. Please try again.');
    }
  };

  const downloadChunk = (chunk: string[], index: number) => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = String(today.getFullYear()).slice(-2);
    const dateStr = `${day}${month}${year}`;

    const blob = new Blob([chunk.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Numbers_${dateStr}_part_${index + 1}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="min-h-screen bg-black/30 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-8">
            <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
              CSV Merger
            </h1>

            <div className="space-y-8">
              {/* File Upload Section */}
              <div className="text-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv"
                  multiple
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full max-w-md mx-auto flex items-center justify-center gap-2 p-8 border-2 border-dashed border-gray-300 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  {selectedFiles ? (
                    <FileCheck className="w-6 h-6 text-green-500" />
                  ) : (
                    <FileUp className="w-6 h-6 text-blue-500" />
                  )}
                  <span className="text-gray-600">
                    {selectedFiles
                      ? `${selectedFiles.length} file(s) selected`
                      : 'Click to select CSV files'}
                  </span>
                </button>

                {selectedFiles && (
                  <div className="mt-4 text-sm text-gray-600">
                    Selected files:{' '}
                    {Array.from(selectedFiles)
                      .map((file) => file.name)
                      .join(', ')}
                  </div>
                )}

                <button
                  onClick={processFiles}
                  className="mt-6 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Process Files
                </button>
              </div>

              {/* Statistics Section */}
              {stats && (
                <div className="bg-gray-50 rounded-2xl p-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    Processing Summary
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow">
                      <div className="text-sm text-gray-600">Total Files</div>
                      <div className="text-2xl font-bold text-gray-800">
                        {stats.totalFiles}
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow">
                      <div className="text-sm text-gray-600">Total Records</div>
                      <div className="text-2xl font-bold text-gray-800">
                        {stats.totalRecords}
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow">
                      <div className="text-sm text-gray-600">
                        Duplicates Removed
                      </div>
                      <div className="text-2xl font-bold text-gray-800">
                        {stats.duplicatesRemoved}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Download Section */}
              {processedChunks.length > 0 && (
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    Generated Files
                  </h2>
                  <div className="space-y-3">
                    {processedChunks.map((chunk, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 p-4 rounded-xl"
                      >
                        <div>
                          <div className="font-semibold text-gray-800">
                            File {index + 1}
                          </div>
                          <div className="text-sm text-gray-600">
                            Records: {chunk.data.length} | Size:{' '}
                            {(chunk.size / 1024).toFixed(2)} KB
                          </div>
                        </div>
                        <button
                          onClick={() => downloadChunk(chunk.data, index)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm text-white py-3 text-center">
          <p className="flex items-center justify-center gap-2">
            Made with <Heart className="w-5 h-5 text-red-400" /> by TAB
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;