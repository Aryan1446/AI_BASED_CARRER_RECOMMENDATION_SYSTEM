#!/usr/bin/env python3
"""
CareerAI Backend API Testing Script
Tests all backend endpoints including auth, assessment, predictions, admin functionality
"""

import requests
import sys
import json
import time
from datetime import datetime
from typing import Dict, Any, Optional

class CareerAITester:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.user_token = None
        self.admin_token = None
        self.test_user_id = None
        self.prediction_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        
        # Test credentials from memory/test_credentials.md
        self.admin_creds = {"username": "admin", "password": "Admin@12345"}
        self.test_user_creds = {
            "username": "testuser",
            "password": "Test@123",
            "email": "test@example.com",
            "full_name": "Test User",
            "age": 25,
            "profession": "Student",
            "phone": "+1234567890"
        }

    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        self.tests_run += 1
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"\n{status} - {test_name}")
        if details:
            print(f"   Details: {details}")
        if response_data and not success:
            print(f"   Response: {response_data}")
        
        if success:
            self.tests_passed += 1
        else:
            self.failed_tests.append({"test": test_name, "details": details, "response": response_data})

    def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None, timeout: int = 30) -> tuple:
        """Make HTTP request with error handling"""
        url = f"{self.api_url}/{endpoint.lstrip('/')}"
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)
        
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=default_headers, timeout=timeout)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, headers=default_headers, timeout=timeout)
            elif method.upper() == 'PUT':
                response = requests.put(url, json=data, headers=default_headers, timeout=timeout)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, headers=default_headers, timeout=timeout)
            else:
                return False, {"error": f"Unsupported method: {method}"}
            
            return True, {
                "status_code": response.status_code,
                "data": response.json() if response.content else {},
                "headers": dict(response.headers)
            }
        except requests.exceptions.Timeout:
            return False, {"error": "Request timeout"}
        except requests.exceptions.ConnectionError:
            return False, {"error": "Connection error"}
        except Exception as e:
            return False, {"error": str(e)}

    def test_health_check(self):
        """Test basic health endpoints"""
        print("\n🔍 Testing Health Endpoints...")
        
        # Test root endpoint
        success, response = self.make_request('GET', '/')
        if success and response['status_code'] == 200:
            self.log_test("Root endpoint", True, f"Status: {response['status_code']}")
        else:
            self.log_test("Root endpoint", False, f"Failed: {response}")
        
        # Test health endpoint
        success, response = self.make_request('GET', '/health')
        if success and response['status_code'] == 200:
            self.log_test("Health endpoint", True, f"Status: {response['status_code']}")
        else:
            self.log_test("Health endpoint", False, f"Failed: {response}")

    def test_user_registration(self):
        """Test user registration"""
        print("\n🔍 Testing User Registration...")
        
        # Create unique username for this test run
        timestamp = int(time.time())
        user_data = {
            **self.test_user_creds,
            "username": f"testuser_{timestamp}",
            "email": f"test_{timestamp}@example.com"
        }
        
        success, response = self.make_request('POST', '/auth/register', user_data)
        
        if success and response['status_code'] == 200:
            data = response['data']
            if 'access_token' in data and 'user' in data:
                self.user_token = data['access_token']
                self.test_user_id = data['user']['id']
                self.log_test("User registration", True, f"User ID: {self.test_user_id}")
            else:
                self.log_test("User registration", False, "Missing token or user data", data)
        else:
            self.log_test("User registration", False, f"Status: {response.get('status_code')}", response)

    def test_user_login(self):
        """Test user login"""
        print("\n🔍 Testing User Login...")
        
        # Use the registered user credentials
        if not self.test_user_id:
            self.log_test("User login", False, "No test user registered")
            return
        
        # Extract username from registration
        timestamp = self.test_user_id  # We'll use a known test user
        login_data = {
            "username": "testuser",  # Use default test user
            "password": "Test@123"
        }
        
        success, response = self.make_request('POST', '/auth/login', login_data)
        
        if success and response['status_code'] == 200:
            data = response['data']
            if 'access_token' in data:
                self.user_token = data['access_token']
                self.log_test("User login", True, f"Token received")
            else:
                self.log_test("User login", False, "No access token", data)
        else:
            self.log_test("User login", False, f"Status: {response.get('status_code')}", response)

    def test_admin_login(self):
        """Test admin login"""
        print("\n🔍 Testing Admin Login...")
        
        success, response = self.make_request('POST', '/auth/login', self.admin_creds)
        
        if success and response['status_code'] == 200:
            data = response['data']
            if 'access_token' in data and data.get('user', {}).get('role') == 'admin':
                self.admin_token = data['access_token']
                self.log_test("Admin login", True, f"Admin token received")
            else:
                self.log_test("Admin login", False, "Invalid admin response", data)
        else:
            self.log_test("Admin login", False, f"Status: {response.get('status_code')}", response)

    def test_protected_endpoint(self):
        """Test protected endpoint access"""
        print("\n🔍 Testing Protected Endpoints...")
        
        if not self.user_token:
            self.log_test("Protected endpoint", False, "No user token available")
            return
        
        headers = {'Authorization': f'Bearer {self.user_token}'}
        success, response = self.make_request('GET', '/auth/me', headers=headers)
        
        if success and response['status_code'] == 200:
            data = response['data']
            if 'username' in data:
                self.log_test("Protected endpoint (/auth/me)", True, f"User: {data.get('username')}")
            else:
                self.log_test("Protected endpoint (/auth/me)", False, "Invalid user data", data)
        else:
            self.log_test("Protected endpoint (/auth/me)", False, f"Status: {response.get('status_code')}", response)

    def test_career_assessment(self):
        """Test career assessment and prediction"""
        print("\n🔍 Testing Career Assessment...")
        
        if not self.user_token:
            self.log_test("Career assessment", False, "No user token available")
            return
        
        # Sample assessment data
        assessment_data = {
            "technical_skills": ["python", "javascript", "sql"],
            "soft_skills": ["communication", "teamwork", "problem_solving"],
            "interests": ["technology", "data", "ai"],
            "logical_ability": 8,
            "creativity_level": 7,
            "communication": 8,
            "leadership": 6,
            "problem_solving": 9,
            "teamwork": 7,
            "work_preference": "hybrid",
            "industry_interest": "technology"
        }
        
        headers = {'Authorization': f'Bearer {self.user_token}'}
        success, response = self.make_request('POST', '/assessment/predict', assessment_data, headers=headers, timeout=60)
        
        if success and response['status_code'] == 200:
            data = response['data']
            if 'recommendations' in data and 'ai_explanation' in data:
                self.prediction_id = data.get('id')
                recommendations = data['recommendations']
                if len(recommendations) >= 3:
                    self.log_test("Career assessment", True, f"Got {len(recommendations)} recommendations, Prediction ID: {self.prediction_id}")
                    
                    # Test recommendation structure
                    first_rec = recommendations[0]
                    required_fields = ['career', 'confidence', 'match_percentage', 'skill_gaps', 'suggestions']
                    if all(field in first_rec for field in required_fields):
                        self.log_test("Recommendation structure", True, f"Top career: {first_rec['career']} ({first_rec['match_percentage']}%)")
                    else:
                        self.log_test("Recommendation structure", False, f"Missing fields in recommendation", first_rec)
                else:
                    self.log_test("Career assessment", False, f"Expected 3+ recommendations, got {len(recommendations)}", data)
            else:
                self.log_test("Career assessment", False, "Missing recommendations or AI explanation", data)
        else:
            self.log_test("Career assessment", False, f"Status: {response.get('status_code')}", response)

    def test_assessment_history(self):
        """Test assessment history retrieval"""
        print("\n🔍 Testing Assessment History...")
        
        if not self.user_token:
            self.log_test("Assessment history", False, "No user token available")
            return
        
        headers = {'Authorization': f'Bearer {self.user_token}'}
        success, response = self.make_request('GET', '/assessment/history', headers=headers)
        
        if success and response['status_code'] == 200:
            data = response['data']
            if isinstance(data, list):
                self.log_test("Assessment history", True, f"Retrieved {len(data)} assessments")
            else:
                self.log_test("Assessment history", False, "Invalid history format", data)
        else:
            self.log_test("Assessment history", False, f"Status: {response.get('status_code')}", response)

    def test_pdf_download(self):
        """Test PDF report download"""
        print("\n🔍 Testing PDF Download...")
        
        if not self.user_token or not self.prediction_id:
            self.log_test("PDF download", False, "No user token or prediction ID available")
            return
        
        headers = {'Authorization': f'Bearer {self.user_token}'}
        url = f"{self.api_url}/assessment/{self.prediction_id}/pdf"
        
        try:
            response = requests.get(url, headers=headers, timeout=30)
            if response.status_code == 200 and response.headers.get('content-type') == 'application/pdf':
                self.log_test("PDF download", True, f"PDF size: {len(response.content)} bytes")
            else:
                self.log_test("PDF download", False, f"Status: {response.status_code}, Content-Type: {response.headers.get('content-type')}")
        except Exception as e:
            self.log_test("PDF download", False, f"Error: {str(e)}")

    def test_admin_endpoints(self):
        """Test admin panel endpoints"""
        print("\n🔍 Testing Admin Endpoints...")
        
        if not self.admin_token:
            self.log_test("Admin endpoints", False, "No admin token available")
            return
        
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        # Test admin stats
        success, response = self.make_request('GET', '/admin/stats', headers=headers)
        if success and response['status_code'] == 200:
            data = response['data']
            required_fields = ['total_users', 'total_predictions', 'model_version', 'model_accuracy']
            if all(field in data for field in required_fields):
                self.log_test("Admin stats", True, f"Users: {data['total_users']}, Predictions: {data['total_predictions']}")
            else:
                self.log_test("Admin stats", False, "Missing required fields", data)
        else:
            self.log_test("Admin stats", False, f"Status: {response.get('status_code')}", response)
        
        # Test admin users
        success, response = self.make_request('GET', '/admin/users', headers=headers)
        if success and response['status_code'] == 200:
            data = response['data']
            if 'users' in data and 'total' in data:
                self.log_test("Admin users", True, f"Retrieved {data['total']} users")
            else:
                self.log_test("Admin users", False, "Invalid users response", data)
        else:
            self.log_test("Admin users", False, f"Status: {response.get('status_code')}", response)
        
        # Test admin predictions
        success, response = self.make_request('GET', '/admin/predictions', headers=headers)
        if success and response['status_code'] == 200:
            data = response['data']
            if 'predictions' in data and 'total' in data:
                self.log_test("Admin predictions", True, f"Retrieved {data['total']} predictions")
            else:
                self.log_test("Admin predictions", False, "Invalid predictions response", data)
        else:
            self.log_test("Admin predictions", False, f"Status: {response.get('status_code')}", response)
        
        # Test model info
        success, response = self.make_request('GET', '/admin/model/info', headers=headers)
        if success and response['status_code'] == 200:
            data = response['data']
            if 'version' in data and 'accuracy' in data:
                self.log_test("Model info", True, f"Version: {data['version']}, Accuracy: {data['accuracy']:.2f}")
            else:
                self.log_test("Model info", False, "Invalid model info", data)
        else:
            self.log_test("Model info", False, f"Status: {response.get('status_code')}", response)

    def test_model_training(self):
        """Test model training functionality"""
        print("\n🔍 Testing Model Training...")
        
        if not self.admin_token:
            self.log_test("Model training", False, "No admin token available")
            return
        
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        success, response = self.make_request('POST', '/admin/model/train', {}, headers=headers, timeout=120)
        
        if success and response['status_code'] == 200:
            data = response['data']
            if 'message' in data and 'version' in data and 'metrics' in data:
                self.log_test("Model training", True, f"New version: {data['version']}, Accuracy: {data['metrics'].get('accuracy', 0):.2f}")
            else:
                self.log_test("Model training", False, "Invalid training response", data)
        else:
            self.log_test("Model training", False, f"Status: {response.get('status_code')}", response)

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting CareerAI Backend API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)
        
        start_time = time.time()
        
        # Run tests in order
        self.test_health_check()
        self.test_user_registration()
        self.test_user_login()
        self.test_admin_login()
        self.test_protected_endpoint()
        self.test_career_assessment()
        self.test_assessment_history()
        self.test_pdf_download()
        self.test_admin_endpoints()
        self.test_model_training()
        
        # Print summary
        end_time = time.time()
        duration = end_time - start_time
        
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"✅ Tests Passed: {self.tests_passed}/{self.tests_run}")
        print(f"❌ Tests Failed: {len(self.failed_tests)}")
        print(f"⏱️  Duration: {duration:.2f} seconds")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for i, test in enumerate(self.failed_tests, 1):
                print(f"{i}. {test['test']}: {test['details']}")
        
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"\n🎯 Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = CareerAITester()
    success = tester.run_all_tests()
    
    # Return appropriate exit code
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())