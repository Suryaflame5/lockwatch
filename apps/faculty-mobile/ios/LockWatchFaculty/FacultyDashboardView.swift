import SwiftUI

struct FacultyDashboardView: View {
    @EnvironmentObject var authVM: FacultyAuthViewModel
    @State private var classes: [FacultyClass] = []
    @State private var loading = true
    @State private var error: String?
    @State private var showCreateClass = false
    @State private var newClassName = ""
    @State private var newClassSubject = ""
    @State private var newClassSection = ""
    @State private var creating = false
    @State private var selectedClass: FacultyClass?
    
    var body: some View {
        NavigationView {
            ZStack {
                Color(hex: "0D1117").ignoresSafeArea()
                
                Group {
                    if loading {
                        ProgressView().tint(Color(hex: "2196F3"))
                    } else if let err = error {
                        VStack {
                            Text(err).foregroundColor(.orange)
                            Button("Retry") { load() }.foregroundColor(Color(hex: "2196F3"))
                        }
                    } else if classes.isEmpty {
                        VStack(spacing: 12) {
                            Image(systemName: "building.columns").font(.system(size: 48)).foregroundColor(Color(hex: "8B949E"))
                            Text("No classes yet").foregroundColor(Color(hex: "8B949E"))
                            Text("Tap + to create your first class").font(.caption).foregroundColor(Color(hex: "8B949E"))
                        }
                    } else {
                        List(classes) { cls in
                            Button(action: { selectedClass = cls }) {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(cls.name).font(.headline).foregroundColor(.white)
                                    Text(cls.subject + (cls.section.map { " · \($0)" } ?? "")).font(.subheadline).foregroundColor(Color(hex: "8B949E"))
                                    Text("Join Code: \(cls.joinCode)").font(.caption).foregroundColor(Color(hex: "00BCD4"))
                                }
                                .padding(.vertical, 4)
                            }
                            .listRowBackground(Color(hex: "161B22"))
                        }
                        .listStyle(.plain)
                        .background(Color(hex: "0D1117"))
                        .scrollContentBackground(.hidden)
                    }
                }
            }
            .navigationTitle("\(authVM.loginResponse?.institution.name ?? "LockWatch")")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Logout") { authVM.logout() }.foregroundColor(.red)
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showCreateClass = true }) { Image(systemName: "plus") }
                }
            }
            .refreshable { await loadAsync() }
            .onAppear { load() }
            .sheet(item: $selectedClass) { cls in
                FacultyClassDetailView(facultyClass: cls)
            }
            .sheet(isPresented: $showCreateClass) {
                NavigationView {
                    ZStack {
                        Color(hex: "0D1117").ignoresSafeArea()
                        VStack(spacing: 16) {
                            TextField("Class Name", text: $newClassName).textFieldStyle(.roundedBorder)
                            TextField("Subject", text: $newClassSubject).textFieldStyle(.roundedBorder)
                            TextField("Section (optional)", text: $newClassSection).textFieldStyle(.roundedBorder)
                            Button(action: { createClass() }) {
                                Group {
                                    if creating { ProgressView().tint(.white) }
                                    else { Text("Create Class").fontWeight(.semibold) }
                                }
                                .frame(maxWidth: .infinity).padding()
                                .background(Color(hex: "2196F3")).foregroundColor(.white).cornerRadius(12)
                            }
                            .disabled(creating || newClassName.isEmpty || newClassSubject.isEmpty)
                            Spacer()
                        }
                        .padding()
                    }
                    .navigationTitle("New Class")
                    .navigationBarItems(leading: Button("Cancel") { showCreateClass = false }.foregroundColor(.red))
                }
            }
        }
    }
    
    func load() { Task { await loadAsync() } }
    
    func loadAsync() async {
        loading = true
        error = nil
        do {
            let cls = try await FacultyAPIService.shared.getClasses()
            await MainActor.run { classes = cls; loading = false }
        } catch let e {
            await MainActor.run { error = e.localizedDescription; loading = false }
        }
    }
    
    func createClass() {
        Task {
            creating = true
            do {
                let cls = try await FacultyAPIService.shared.createClass(
                    name: newClassName,
                    subject: newClassSubject,
                    section: newClassSection.isEmpty ? nil : newClassSection
                )
                await MainActor.run {
                    classes.append(cls)
                    showCreateClass = false
                    newClassName = ""
                    newClassSubject = ""
                    newClassSection = ""
                    creating = false
                }
            } catch {
                await MainActor.run { creating = false }
            }
        }
    }
}
