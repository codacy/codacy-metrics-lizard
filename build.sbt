import sbt.Keys._
import sbt._

name := "codacy-metrics-lizard"

version := "1.0.0-SNAPSHOT"

val scalaBinaryVersionNumber = "2.12"
val scalaVersionNumber = s"$scalaBinaryVersionNumber.4"

scalaVersion := scalaVersionNumber
scalaVersion in ThisBuild := scalaVersionNumber
scalaBinaryVersion in ThisBuild := scalaBinaryVersionNumber

scapegoatVersion in ThisBuild := "1.3.5"

lazy val codacyMetricsLizard = project
  .in(file("."))
  .enablePlugins(JavaAppPackaging)
  .enablePlugins(DockerPlugin)
  .settings(
    inThisBuild(
      List(
        organization := "com.codacy",
        scalaVersion := scalaVersionNumber,
        version := "0.1.0-SNAPSHOT",
        resolvers := Seq("Sonatype OSS Snapshots".at("https://oss.sonatype.org/content/repositories/releases")) ++ resolvers.value,
        scalacOptions ++= Common.compilerFlags,
        scalacOptions in Test ++= Seq("-Yrangepos"),
        scalacOptions in (Compile, console) --= Seq("-Ywarn-unused:imports", "-Xfatal-warnings"))),
    // App Dependencies
    libraryDependencies ++= Seq(Dependencies.Codacy.metricsSeed),
    // Test Dependencies
    libraryDependencies ++= Seq(Dependencies.specs2).map(_ % Test))
  .settings(Common.dockerSettings: _*)
