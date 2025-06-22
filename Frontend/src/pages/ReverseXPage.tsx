import { useState } from 'react';
import { Upload, FileText, Code, Play, Download, AlertTriangle } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { formatFileSize } from '../lib/utils';

const ReverseXPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setAnalysisResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    
    setIsAnalyzing(true);
    
    // Simulate analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock analysis result
    setAnalysisResult({
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
        architecture: 'x86_64',
        format: 'ELF',
      },
      sections: [
        { name: '.text', address: '0x1000', size: '4096', type: 'CODE' },
        { name: '.data', address: '0x2000', size: '2048', type: 'DATA' },
        { name: '.rodata', address: '0x3000', size: '1024', type: 'RODATA' },
      ],
      imports: [
        'libc.so.6',
        'libpthread.so.0',
        'libdl.so.2',
      ],
      strings: [
        'GetProcAddress',
        'LoadLibraryA',
        'kernel32.dll',
        'user32.dll',
      ],
    });
    
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">ReverseX</h1>
        <p className="text-gray-400">
          Advanced binary analysis toolkit for reverse engineering suspicious executables.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Binary Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-lg p-8 text-center border-dark-600">
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".exe,.dll,.so,.dylib,.bin"
                  id="file-upload"
                />
                
                {!file ? (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="p-4 rounded-full bg-dark-700">
                        <Upload className="h-8 w-8 text-primary-500" />
                      </div>
                    </div>
                    <div>
                      <p className="text-white font-medium">Upload a binary file for analysis</p>
                      <p className="text-gray-400 text-sm mt-1">
                        Supported formats: EXE, DLL, SO, DYLIB, BIN
                      </p>
                    </div>
                    <label htmlFor="file-upload">
                      <Button variant="outline">
                        Select File
                      </Button>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="p-4 rounded-full bg-dark-700">
                        <FileText className="h-8 w-8 text-primary-500" />
                      </div>
                    </div>
                    <div>
                      <p className="text-white font-medium">{file.name}</p>
                      <p className="text-gray-400 text-sm mt-1">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <div className="flex justify-center space-x-3">
                      <Button
                        onClick={handleAnalyze}
                        isLoading={isAnalyzing}
                        disabled={isAnalyzing}
                        leftIcon={<Code className="h-4 w-4" />}
                      >
                        {isAnalyzing ? 'Analyzing...' : 'Analyze Binary'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setFile(null);
                          setAnalysisResult(null);
                        }}
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Analysis Result */}
              {analysisResult && (
                <div className="mt-8 space-y-6">
                  <div className="bg-dark-700 border border-dark-600 rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-dark-600">
                      <h3 className="text-lg font-semibold text-white">File Information</h3>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-400 text-sm">File Name</p>
                          <p className="text-white">{analysisResult.fileInfo.name}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Size</p>
                          <p className="text-white">{formatFileSize(analysisResult.fileInfo.size)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Architecture</p>
                          <p className="text-white">{analysisResult.fileInfo.architecture}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Format</p>
                          <p className="text-white">{analysisResult.fileInfo.format}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-dark-700 border border-dark-600 rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-dark-600">
                      <h3 className="text-lg font-semibold text-white">Sections</h3>
                    </div>
                    <div className="p-4">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="text-left text-gray-400 text-sm">
                              <th className="pb-2">Name</th>
                              <th className="pb-2">Address</th>
                              <th className="pb-2">Size</th>
                              <th className="pb-2">Type</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analysisResult.sections.map((section: any, index: number) => (
                              <tr key={index} className="border-t border-dark-600">
                                <td className="py-2 text-white font-mono text-sm">{section.name}</td>
                                <td className="py-2 text-white font-mono text-sm">{section.address}</td>
                                <td className="py-2 text-white font-mono text-sm">{section.size}</td>
                                <td className="py-2 text-white font-mono text-sm">{section.type}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="bg-dark-700 border border-dark-600 rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-dark-600">
                      <h3 className="text-lg font-semibold text-white">Imports</h3>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-2">
                        {analysisResult.imports.map((imp: string, index: number) => (
                          <div key={index} className="font-mono text-sm text-white bg-dark-800 p-2 rounded">
                            {imp}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-dark-700 border border-dark-600 rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-dark-600">
                      <h3 className="text-lg font-semibold text-white">Strings</h3>
                    </div>
                    <div className="p-4">
                      <div className="bg-dark-800 p-4 rounded font-mono text-sm">
                        {analysisResult.strings.map((str: string, index: number) => (
                          <div key={index} className="text-white">{str}</div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <Button leftIcon={<Download className="h-4 w-4" />}>
                      Download Report
                    </Button>
                    <Button variant="outline" leftIcon={<Play className="h-4 w-4" />}>
                      Dynamic Analysis
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info Panel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Analysis Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-dark-800 rounded-lg">
                  <h3 className="text-white font-medium mb-2">Static Analysis</h3>
                  <ul className="text-gray-400 text-sm space-y-2">
                    <li>• File format identification</li>
                    <li>• Section analysis</li>
                    <li>• Import/Export tables</li>
                    <li>• String extraction</li>
                    <li>• Entropy analysis</li>
                  </ul>
                </div>

                <div className="p-4 bg-dark-800 rounded-lg">
                  <h3 className="text-white font-medium mb-2">Dynamic Analysis</h3>
                  <ul className="text-gray-400 text-sm space-y-2">
                    <li>• Behavior monitoring</li>
                    <li>• API call tracing</li>
                    <li>• Memory analysis</li>
                    <li>• Network activity</li>
                  </ul>
                </div>

                <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                  <div className="flex items-center text-warning mb-2">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    <h3 className="font-medium">Safety Notice</h3>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Always analyze suspicious files in a secure, isolated environment.
                    Never run unknown binaries on production systems.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReverseXPage;