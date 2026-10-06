package com.lockwatch.faculty.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lockwatch.faculty.ui.*
import com.lockwatch.faculty.data.FacultyApiClient
import com.lockwatch.faculty.data.LoginResponse
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
fun FacultyLoginScreen(onLoginSuccess: (LoginResponse) -> Unit) {
    val scope = rememberCoroutineScope()
    var email by remember { mutableStateOf("faculty@apextech.edu") }
    var password by remember { mutableStateOf("FacultyPassword123!") }
    var isPasswordVisible by remember { mutableStateOf(false) }
    var loading by remember { mutableStateOf(false) }
    var errorMsg by remember { mutableStateOf<String?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BgDark)
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("LockWatch", fontSize = 32.sp, fontWeight = FontWeight.Bold, color = BrandWhite)
        Text("Faculty Portal", fontSize = 16.sp, color = TextSecondary)
        Spacer(Modifier.height(48.dp))

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = CardDark)
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text("Sign In", fontSize = 20.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary)

                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email", color = TextSecondary) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary,
                        focusedBorderColor = BrandWhite,
                        unfocusedBorderColor = TextSecondary,
                        focusedLabelColor = BrandWhite
                    )
                )

                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Password", color = TextSecondary) },
                    trailingIcon = {
                        IconButton(onClick = { isPasswordVisible = !isPasswordVisible }) {
                            Icon(
                                imageVector = if (isPasswordVisible) androidx.compose.material.icons.Icons.Default.Visibility else androidx.compose.material.icons.Icons.Default.VisibilityOff,
                                contentDescription = if (isPasswordVisible) "Hide password" else "Show password",
                                tint = BrandGray
                            )
                        }
                    },
                    visualTransformation = if (isPasswordVisible) androidx.compose.ui.text.input.VisualTransformation.None else PasswordVisualTransformation(),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary,
                        focusedBorderColor = BrandWhite,
                        unfocusedBorderColor = TextSecondary,
                        focusedLabelColor = BrandWhite
                    )
                )

                errorMsg?.let { Text(it, color = AlertRed, fontSize = 13.sp) }

                Button(
                    onClick = {
                        scope.launch {
                            loading = true
                            errorMsg = null
                            try {
                                val resp = withContext(Dispatchers.IO) {
                                    FacultyApiClient.login(email.trim(), password)
                                }
                                onLoginSuccess(resp)
                            } catch (e: Exception) {
                                errorMsg = e.message ?: "Login failed"
                            } finally {
                                loading = false
                            }
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    enabled = !loading && email.isNotBlank() && password.isNotBlank(),
                    colors = ButtonDefaults.buttonColors(containerColor = BrandWhite, contentColor = Color.Black)
                ) {
                    if (loading) {
                        CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.Black, strokeWidth = 2.dp)
                    } else {
                        Text("Sign In", color = Color.Black, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }
    }
}
