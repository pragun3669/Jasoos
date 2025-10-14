import React, { useState } from 'react';
import { 
  User, Mail, Phone, Users, ArrowRight, Shield, Clock, AlertCircle, CheckCircle
} from 'lucide-react';
import axios from 'axios';

const StudentRegistration = ({ test, onSubmit, token }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    batch: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error as user types
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    else if (formData.name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters';

    if (!formData.email.trim()) newErrors.email = 'Email address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Please enter a valid email address';

    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(formData.phone.replace(/\s/g, '')))
      newErrors.phone = 'Please enter a valid phone number';

    if (!formData.batch.trim()) newErrors.batch = 'Batch/Class information is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Call backend API to submit student info
      const payload = { 
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        batch: formData.batch
      };

      await axios.post(`http://localhost:8081/api/tests/link/${token}/submit`, payload);

      if (onSubmit) onSubmit(payload); // optional parent callback
      alert('Registration successful! You can now start the assessment.');
      // Optionally: redirect to test start page
    } catch (error) {
      console.error(error);
      alert('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const testData = test || { title: 'Sample Coding Assessment', duration: 60, questions: [{ id: 1 }] };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-center">
          <img src="/Your paragraph text (1).png" alt="Jasoos Logo" className="h-12 w-auto mr-4" />
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              JASOOS:AI
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">AI-Powered Exam Proctoring</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-br from-green-400 to-blue-500 p-4 rounded-xl w-fit mx-auto mb-6">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">Welcome to</h1>
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent mb-4">
            {testData.title}
          </h2>
          <div className="flex items-center justify-center space-x-6 text-gray-600 dark:text-gray-400">
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-2 text-green-400" />
              <span className="font-medium">{testData.duration} minutes</span>
            </div>
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-400" />
              <span className="font-medium">{testData.questions.length} questions</span>
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/** Input Fields **/}
            {['name', 'email', 'phone', 'batch'].map((field) => {
              const icons = { name: User, email: Mail, phone: Phone, batch: Users };
              const Icon = icons[field];
              return (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
                    {field === 'batch' ? 'Batch/Class *' : `${field.charAt(0).toUpperCase() + field.slice(1)} *`}
                  </label>
                  <div className="relative">
                    <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={field === 'email' ? 'email' : 'text'}
                      name={field}
                      value={formData[field]}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                        errors[field]
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 dark:border-gray-600 focus:ring-green-500'
                      } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-colors`}
                      placeholder={`Enter your ${field}${field === 'batch' ? ' or class' : ''}`}
                    />
                    {errors[field] ? (
                      <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-500" />
                    ) : formData[field] ? (
                      <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
                    ) : null}
                  </div>
                  {errors[field] && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors[field]}
                    </p>
                  )}
                </div>
              );
            })}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-semibold py-4 px-6 rounded-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center shadow-lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Registering...
                </>
              ) : (
                <>
                  Begin Assessment
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentRegistration;
