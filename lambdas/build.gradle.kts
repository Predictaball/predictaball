import org.jetbrains.kotlin.gradle.internal.KaptGenerateStubsTask
import org.jlleitschuh.gradle.ktlint.tasks.KtLintFormatTask
import org.openapitools.generator.gradle.plugin.tasks.GenerateTask

buildscript {
    repositories {
        mavenCentral()
        maven("https://plugins.gradle.org/m2/")
    }
    dependencies {
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:2.3.20")
        classpath("org.openapitools:openapi-generator-gradle-plugin:6.0.0")
    }
}

plugins {
    kotlin("jvm") version "2.3.20"
    id("org.jlleitschuh.gradle.ktlint") version "12.1.0"
    id("com.gradleup.shadow") version "9.3.2"
    application
    jacoco
}

apply(plugin = "org.openapi.generator")

group = "org.openapitools"
version = "1.0.0"

application {
    mainClass.set("scorcerer.server.ServerKt")
}

kotlin {
    jvmToolchain(21)
}

repositories {
    mavenCentral()
}

sourceSets {
    main {
        java {
            srcDir(layout.buildDirectory.dir("generated/src"))
        }
    }
}

ktlint {
    filter {
        include("$rootDir/src/**/*.kt")
        exclude { it.file.toString().contains("generated") }
    }
}

dependencies {
    implementation(platform("org.http4k:http4k-bom:6.39.0.0"))
    implementation("org.http4k:http4k-core")
    implementation("org.http4k:http4k-format-jackson")
    implementation("org.http4k:http4k-server-netty")
    implementation("org.http4k:http4k-client-okhttp")

    implementation("aws.sdk.kotlin:s3:1.2.15")
    implementation("aws.sdk.kotlin:cognitoidentityprovider:1.2.5")
    implementation("aws.sdk.kotlin:sqs:1.2.15")

    implementation("org.jetbrains.exposed:exposed-core:1.1.1")
    implementation("org.jetbrains.exposed:exposed-dao:1.1.1")
    implementation("org.jetbrains.exposed:exposed-kotlin-datetime:1.1.1")
    implementation("org.jetbrains.exposed:exposed-java-time:1.1.1")
    implementation("org.jetbrains.exposed:exposed-jdbc:1.1.1")

    implementation("org.postgresql:postgresql:42.7.3")
    implementation("com.zaxxer:HikariCP:6.2.1")

    implementation("com.fasterxml.jackson.core:jackson-core:2.17.1")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin:2.17.1")
    implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310:2.17.1")

    implementation("org.slf4j:slf4j-simple:2.0.6")

    testImplementation("io.kotest:kotest-runner-junit5:5.9.0")
    testImplementation("io.kotest:kotest-extensions-jvm:5.9.0")
    testImplementation("org.junit.jupiter:junit-jupiter-engine:5.10.2")
    testImplementation("org.junit.jupiter:junit-jupiter-params:5.10.2")
    testImplementation("com.h2database:h2:2.2.224")
    testImplementation("io.mockk:mockk:1.13.16")
}

tasks {
    build {
        dependsOn(shadowJar)
    }

    shadowJar {
        archiveBaseName.set("scorcerer")
        archiveClassifier.set("")
        archiveVersion.set("")
        mergeServiceFiles()
    }

    test {
        useJUnitPlatform()
        finalizedBy(jacocoTestReport)
    }

    jacocoTestReport {
        reports {
            xml.required.set(false)
            csv.required.set(false)
            html.required.set(true)
        }
        classDirectories.setFrom(
            sourceSets.main.get().output.classesDirs.map {
                fileTree(it) { exclude("org/openapitools/**") }
            },
        )
    }

    jacocoTestCoverageVerification {
        violationRules {
            rule {
                limit {
                    minimum = "0.0".toBigDecimal()
                }
            }
        }
    }

    build {
        dependsOn(jacocoTestCoverageVerification)
    }

    compileKotlin {
        dependsOn("generateKotlinServer", "ktlintFormat")
    }

    withType<KaptGenerateStubsTask>().configureEach {
        dependsOn("generateKotlinServer")
    }

    withType<KtLintFormatTask>().configureEach {
        dependsOn("generateKotlinServer")
        inputs.dir(layout.buildDirectory.dir("generated/src"))
        inputs.dir("$rootDir/src")
    }

    register<GenerateTask>("generateKotlinServer") {
        generatorName.set("kotlin-server")
        inputSpec.set("$rootDir/contract/api-contract.yaml")
        additionalProperties.set(mapOf("interfaceOnly" to "true", "library" to "jaxrs-spec", "enumPropertyNaming" to "UPPERCASE"))
        outputDir.set(layout.buildDirectory.dir("generated").map { it.asFile.absolutePath })
        globalProperties.set(mapOf("models" to ""))
        inputs.file("$rootDir/contract/api-contract.yaml")
    }

    register<JavaExec>("runLocal") {
        classpath = sourceSets.main.get().runtimeClasspath
        mainClass.set("scorcerer.server.ServerKt")
        environment("DB_USER", "postgres")
        environment("DB_PASSWORD", "postgres")
        environment("DB_URL", "localhost")
        environment("DB_NAME", "postgres")
        environment("DB_PORT", "5432")
        environment("USER_POOL_CLIENT_ID", "dummy")
        environment("USER_POOL_ID", "dummy")
        environment("SCORE_UPDATE_QUEUE_URL", "dummy")
        environment("LEADERBOARD_BUCKET_NAME", "dummy")
        environment("AUTH_DISABLED", "true")
        environment("TEST_USER_ID", "test-user-123")
    }
}

jacoco {
    toolVersion = "0.8.12"
}
