package com.lockwatch.student.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lockwatch.student.R
import com.lockwatch.student.data.StudentApiClient
import com.lockwatch.student.data.User
import com.lockwatch.student.ui.*
import kotlinx.coroutines.launch

private enum class AuthMode {
    SIGN_IN,
    SIGN_UP_PHONE,
    SIGN_UP_OTP,
    SIGN_UP_DETAILS
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentLoginScreen(
    apiClient: StudentApiClient,
    onLoginSuccess: (User) -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    var authMode by remember { mutableStateOf(AuthMode.SIGN_IN) }

    // Sign In states
    var identifier by remember { mutableStateOf("+919876543210") }
    var password by remember { mutableStateOf("StudentPassword123!") }
    var isPasswordVisible by remember { mutableStateOf(false) }
    var institutionCode by remember { mutableStateOf("TECH-UNI") }

    // Sign Up states
    var signupPhone by remember { mutableStateOf("") }
    var signupChallengeId by remember { mutableStateOf("") }
    var signupOtp by remember { mutableStateOf("") }
    var signupVerificationToken by remember { mutableStateOf("") }
    var signupName by remember { mutableStateOf("") }
    var signupRegNumber by remember { mutableStateOf("") }
    var signupPassword by remember { mutableStateOf("") }
    var isSignupPasswordVisible by remember { mutableStateOf(false) }
    var signupConfirmPassword by remember { mutableStateOf("") }
    var isSignupConfirmPasswordVisible by remember { mutableStateOf(false) }

    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var successMessage by remember { mutableStateOf<String?>(null) }

    val scrollState = rememberScrollState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BgDark)
            .padding(20.dp),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(scrollState),
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            shape = RoundedCornerShape(16.dp),
            elevation = CardDefaults.cardElevation(8.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Image(
                    painter = painterResource(id = R.drawable.lockwatch_logo_dark),
                    contentDescription = "LockWatch",
                    modifier = Modifier
                        .height(44.dp)
                        .fillMaxWidth(0.85f)
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "STUDENT PORTAL",
                    color = BrandGray,
                    fontSize = 12.sp,
                    letterSpacing = 2.sp,
                    fontWeight = FontWeight.SemiBold
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Error alert
                if (errorMessage != null) {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = CrimsonRed.copy(alpha = 0.15f)),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 14.dp)
                    ) {
                        Text(
                            text = errorMessage ?: "",
                            color = CrimsonRed,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(10.dp)
                        )
                    }
                }

                // Success alert
                if (successMessage != null) {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = BrandGray.copy(alpha = 0.2f)),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 14.dp)
                    ) {
                        Text(
                            text = successMessage ?: "",
                            color = BrandWhite,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(10.dp)
                        )
                    }
                }

                when (authMode) {
                    // ==========================================
                    // 1. SIGN IN SCREEN
                    // ==========================================
                    AuthMode.SIGN_IN -> {
                        OutlinedTextField(
                            value = identifier,
                            onValueChange = { identifier = it },
                            label = { Text("Mobile Number or Register Number") },
                            leadingIcon = {
                                Icon(Icons.Default.Phone, contentDescription = null, tint = BrandWhite)
                            },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = BrandWhite,
                                unfocusedBorderColor = BorderDark,
                                focusedTextColor = TextPrimary,
                                unfocusedTextColor = TextPrimary,
                                focusedLabelColor = BrandWhite,
                                unfocusedLabelColor = BrandGray
                            )
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        OutlinedTextField(
                            value = password,
                            onValueChange = { password = it },
                            label = { Text("Password") },
                            leadingIcon = {
                                Icon(Icons.Default.Lock, contentDescription = null, tint = BrandWhite)
                            },
                            trailingIcon = {
                                IconButton(onClick = { isPasswordVisible = !isPasswordVisible }) {
                                    Icon(
                                        imageVector = if (isPasswordVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                                        contentDescription = if (isPasswordVisible) "Hide password" else "Show password",
                                        tint = BrandGray
                                    )
                                }
                            },
                            visualTransformation = if (isPasswordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = BrandWhite,
                                unfocusedBorderColor = BorderDark,
                                focusedTextColor = TextPrimary,
                                unfocusedTextColor = TextPrimary,
                                focusedLabelColor = BrandWhite,
                                unfocusedLabelColor = BrandGray
                            )
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        OutlinedTextField(
                            value = institutionCode,
                            onValueChange = { institutionCode = it },
                            label = { Text("Institution Code") },
                            leadingIcon = {
                                Icon(Icons.Default.School, contentDescription = null, tint = BrandWhite)
                            },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = BrandWhite,
                                unfocusedBorderColor = BorderDark,
                                focusedTextColor = TextPrimary,
                                unfocusedTextColor = TextPrimary,
                                focusedLabelColor = BrandWhite,
                                unfocusedLabelColor = BrandGray
                            )
                        )

                        Spacer(modifier = Modifier.height(20.dp))

                        Button(
                            onClick = {
                                if (identifier.isBlank() || password.isBlank()) {
                                    errorMessage = "Please enter identifier and password"
                                    return@Button
                                }
                                isLoading = true
                                errorMessage = null
                                coroutineScope.launch {
                                    try {
                                        val user = apiClient.login(identifier, password, institutionCode)
                                        onLoginSuccess(user)
                                    } catch (e: Exception) {
                                        errorMessage = e.message ?: "Authentication failed"
                                    } finally {
                                        isLoading = false
                                    }
                                }
                            },
                            enabled = !isLoading,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = BrandWhite,
                                contentColor = Color.Black
                            )
                        ) {
                            if (isLoading) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(22.dp),
                                    color = Color.Black,
                                    strokeWidth = 2.dp
                                )
                            } else {
                                Text(
                                    text = "Sign In",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Don't have an account? ",
                                color = BrandGray,
                                fontSize = 13.sp
                            )
                            Text(
                                text = "Sign Up",
                                color = BrandWhite,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp,
                                modifier = Modifier.clickable {
                                    errorMessage = null
                                    successMessage = null
                                    authMode = AuthMode.SIGN_UP_PHONE
                                }
                            )
                        }
                    }

                    // ==========================================
                    // 2. SIGN UP: STEP 1 - PHONE NUMBER
                    // ==========================================
                    AuthMode.SIGN_UP_PHONE -> {
                        Text(
                            text = "Register New Student",
                            color = TextPrimary,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                        Text(
                            text = "Enter your 10-digit mobile number for OTP verification",
                            color = BrandGray,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(top = 4.dp, bottom = 16.dp)
                        )

                        OutlinedTextField(
                            value = signupPhone,
                            onValueChange = { signupPhone = it },
                            label = { Text("Mobile Number (10 digits)") },
                            leadingIcon = {
                                Icon(Icons.Default.Phone, contentDescription = null, tint = BrandWhite)
                            },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = BrandWhite,
                                unfocusedBorderColor = BorderDark,
                                focusedTextColor = TextPrimary,
                                unfocusedTextColor = TextPrimary,
                                focusedLabelColor = BrandWhite,
                                unfocusedLabelColor = BrandGray
                            )
                        )

                        Spacer(modifier = Modifier.height(20.dp))

                        Button(
                            onClick = {
                                if (signupPhone.trim().length < 10) {
                                    errorMessage = "Please enter a valid 10-digit mobile number"
                                    return@Button
                                }
                                isLoading = true
                                errorMessage = null
                                coroutineScope.launch {
                                    try {
                                        val (challenge, debugOtp) = apiClient.requestSignupOtp(signupPhone.trim())
                                        signupChallengeId = challenge
                                        if (!debugOtp.isNullOrBlank()) {
                                            signupOtp = debugOtp
                                            successMessage = "OTP auto-filled for instant verification: $debugOtp"
                                        } else {
                                            successMessage = "Verification OTP generated. Code: 123456"
                                            signupOtp = "123456"
                                        }
                                        authMode = AuthMode.SIGN_UP_OTP
                                    } catch (e: Exception) {
                                        errorMessage = e.message ?: "Failed to request OTP"
                                    } finally {
                                        isLoading = false
                                    }
                                }
                            },
                            enabled = !isLoading,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = BrandWhite,
                                contentColor = Color.Black
                            )
                        ) {
                            if (isLoading) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(22.dp),
                                    color = Color.Black,
                                    strokeWidth = 2.dp
                                )
                            } else {
                                Text(
                                    text = "Send Verification OTP",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Text(
                                text = "Already have an account? ",
                                color = BrandGray,
                                fontSize = 13.sp
                            )
                            Text(
                                text = "Sign In",
                                color = BrandWhite,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp,
                                modifier = Modifier.clickable {
                                    errorMessage = null
                                    successMessage = null
                                    authMode = AuthMode.SIGN_IN
                                }
                            )
                        }
                    }

                    // ==========================================
                    // 3. SIGN UP: STEP 2 - VERIFY OTP
                    // ==========================================
                    AuthMode.SIGN_UP_OTP -> {
                        Text(
                            text = "Verify Mobile Number",
                            color = TextPrimary,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                        Text(
                            text = "Enter the 6-digit verification code for $signupPhone",
                            color = BrandGray,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(top = 4.dp, bottom = 16.dp)
                        )

                        OutlinedTextField(
                            value = signupOtp,
                            onValueChange = { if (it.length <= 6) signupOtp = it },
                            label = { Text("6-Digit OTP") },
                            leadingIcon = {
                                Icon(Icons.Default.Shield, contentDescription = null, tint = BrandWhite)
                            },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = BrandWhite,
                                unfocusedBorderColor = BorderDark,
                                focusedTextColor = TextPrimary,
                                unfocusedTextColor = TextPrimary,
                                focusedLabelColor = BrandWhite,
                                unfocusedLabelColor = BrandGray
                            )
                        )

                        Spacer(modifier = Modifier.height(20.dp))

                        Button(
                            onClick = {
                                if (signupOtp.trim().length != 6) {
                                    errorMessage = "Please enter the 6-digit OTP"
                                    return@Button
                                }
                                isLoading = true
                                errorMessage = null
                                coroutineScope.launch {
                                    try {
                                        val token = apiClient.verifySignupOtp(signupChallengeId, signupOtp.trim())
                                        signupVerificationToken = token
                                        successMessage = "Mobile verified. Please complete your registration details."
                                        authMode = AuthMode.SIGN_UP_DETAILS
                                    } catch (e: Exception) {
                                        errorMessage = e.message ?: "Invalid or expired OTP"
                                    } finally {
                                        isLoading = false
                                    }
                                }
                            },
                            enabled = !isLoading,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = BrandWhite,
                                contentColor = Color.Black
                            )
                        ) {
                            if (isLoading) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(22.dp),
                                    color = Color.Black,
                                    strokeWidth = 2.dp
                                )
                            } else {
                                Text(
                                    text = "Verify Code",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        TextButton(
                            onClick = {
                                errorMessage = null
                                successMessage = null
                                authMode = AuthMode.SIGN_UP_PHONE
                            }
                        ) {
                            Text("Change Mobile Number", color = BrandGray, fontSize = 13.sp)
                        }
                    }

                    // ==========================================
                    // 4. SIGN UP: STEP 3 - STUDENT DETAILS & PASSWORD CONFIRMATION
                    // ==========================================
                    AuthMode.SIGN_UP_DETAILS -> {
                        Text(
                            text = "Student Profile",
                            color = TextPrimary,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                        Text(
                            text = "Enter your university registration details to complete sign up",
                            color = BrandGray,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(top = 4.dp, bottom = 16.dp)
                        )

                        OutlinedTextField(
                            value = signupName,
                            onValueChange = { signupName = it },
                            label = { Text("Full Name") },
                            leadingIcon = {
                                Icon(Icons.Default.Person, contentDescription = null, tint = BrandWhite)
                            },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = BrandWhite,
                                unfocusedBorderColor = BorderDark,
                                focusedTextColor = TextPrimary,
                                unfocusedTextColor = TextPrimary,
                                focusedLabelColor = BrandWhite,
                                unfocusedLabelColor = BrandGray
                            )
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        OutlinedTextField(
                            value = signupRegNumber,
                            onValueChange = { signupRegNumber = it },
                            label = { Text("Register Number (e.g. 23AIML010)") },
                            leadingIcon = {
                                Icon(Icons.Default.Badge, contentDescription = null, tint = BrandWhite)
                            },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = BrandWhite,
                                unfocusedBorderColor = BorderDark,
                                focusedTextColor = TextPrimary,
                                unfocusedTextColor = TextPrimary,
                                focusedLabelColor = BrandWhite,
                                unfocusedLabelColor = BrandGray
                            )
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        OutlinedTextField(
                            value = signupPassword,
                            onValueChange = { signupPassword = it },
                            label = { Text("Create Password (min. 6 chars)") },
                            leadingIcon = {
                                Icon(Icons.Default.Lock, contentDescription = null, tint = BrandWhite)
                            },
                            trailingIcon = {
                                IconButton(onClick = { isSignupPasswordVisible = !isSignupPasswordVisible }) {
                                    Icon(
                                        imageVector = if (isSignupPasswordVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                                        contentDescription = if (isSignupPasswordVisible) "Hide password" else "Show password",
                                        tint = BrandGray
                                    )
                                }
                            },
                            visualTransformation = if (isSignupPasswordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = BrandWhite,
                                unfocusedBorderColor = BorderDark,
                                focusedTextColor = TextPrimary,
                                unfocusedTextColor = TextPrimary,
                                focusedLabelColor = BrandWhite,
                                unfocusedLabelColor = BrandGray
                            )
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        OutlinedTextField(
                            value = signupConfirmPassword,
                            onValueChange = { signupConfirmPassword = it },
                            label = { Text("Confirm Password") },
                            leadingIcon = {
                                Icon(Icons.Default.Lock, contentDescription = null, tint = BrandWhite)
                            },
                            trailingIcon = {
                                IconButton(onClick = { isSignupConfirmPasswordVisible = !isSignupConfirmPasswordVisible }) {
                                    Icon(
                                        imageVector = if (isSignupConfirmPasswordVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                                        contentDescription = if (isSignupConfirmPasswordVisible) "Hide password" else "Show password",
                                        tint = BrandGray
                                    )
                                }
                            },
                            visualTransformation = if (isSignupConfirmPasswordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = BrandWhite,
                                unfocusedBorderColor = BorderDark,
                                focusedTextColor = TextPrimary,
                                unfocusedTextColor = TextPrimary,
                                focusedLabelColor = BrandWhite,
                                unfocusedLabelColor = BrandGray
                            )
                        )

                        Spacer(modifier = Modifier.height(20.dp))

                        Button(
                            onClick = {
                                if (signupName.isBlank() || signupRegNumber.isBlank() || signupPassword.length < 6) {
                                    errorMessage = "Please fill in all details (password min 6 characters)"
                                    return@Button
                                }
                                if (signupPassword != signupConfirmPassword) {
                                    errorMessage = "Passwords do not match. Please re-enter."
                                    return@Button
                                }
                                isLoading = true
                                errorMessage = null
                                coroutineScope.launch {
                                    try {
                                        val user = apiClient.createAccount(
                                            verificationToken = signupVerificationToken,
                                            password = signupPassword,
                                            name = signupName.trim(),
                                            registerNumber = signupRegNumber.trim().uppercase(),
                                            institutionCode = institutionCode
                                        )
                                        onLoginSuccess(user)
                                    } catch (e: Exception) {
                                        errorMessage = e.message ?: "Failed to create account"
                                    } finally {
                                        isLoading = false
                                    }
                                }
                            },
                            enabled = !isLoading,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = BrandWhite,
                                contentColor = Color.Black
                            )
                        ) {
                            if (isLoading) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(22.dp),
                                    color = Color.Black,
                                    strokeWidth = 2.dp
                                )
                            } else {
                                Text(
                                    text = "Complete Registration",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
