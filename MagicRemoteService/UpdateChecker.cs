namespace MagicRemoteService {
	internal static class UpdateChecker {
		private const string RepoOwner = "KTheMan";
		private const string RepoName = "MagicRemoteService-HBC";
		private const string InstallerAssetPrefix = "MagicRemoteService-Setup-";

		private static readonly System.Net.Http.HttpClient hcGitHub;

		static UpdateChecker() {
			System.Net.ServicePointManager.SecurityProtocol |= System.Net.SecurityProtocolType.Tls12;
			UpdateChecker.hcGitHub = new System.Net.Http.HttpClient {
				Timeout = System.TimeSpan.FromSeconds(10)
			};
			UpdateChecker.hcGitHub.DefaultRequestHeaders.UserAgent.ParseAdd("MagicRemoteService-UpdateChecker");
			UpdateChecker.hcGitHub.DefaultRequestHeaders.Accept.ParseAdd("application/vnd.github+json");
		}

		public sealed class UpdateInfo {
			public string LatestVersion;
			public string ReleaseUrl;
		}

		private sealed class ReleaseInfo {
			public string Tag;
			public string HtmlUrl;
			public string InstallerDigest;
		}

		// Checks the installed installer's binary against the latest release, not
		// just version numbers: a re-published release under the same tag with a
		// fixed/updated installer binary must still be detected as an update.
		public static async System.Threading.Tasks.Task<MagicRemoteService.UpdateChecker.UpdateInfo> CheckForUpdateAsync() {
			string strInstalledVersion = MagicRemoteService.UpdateChecker.GetInstalledVersion();
			if(string.IsNullOrEmpty(strInstalledVersion)) {
				return null;
			}

			MagicRemoteService.UpdateChecker.ReleaseInfo riLatest = await MagicRemoteService.UpdateChecker.GetReleaseAsync("latest").ConfigureAwait(false);
			if(riLatest == null || riLatest.InstallerDigest == null) {
				return null;
			}

			string strInstalledTag = "v" + strInstalledVersion;
			bool bUpdateAvailable;
			if(string.Equals(strInstalledTag, riLatest.Tag, System.StringComparison.OrdinalIgnoreCase)) {
				// Same tag as installed - only an update if the installer asset itself changed.
				MagicRemoteService.UpdateChecker.ReleaseInfo riInstalled = await MagicRemoteService.UpdateChecker.GetReleaseAsync("tags/" + strInstalledTag).ConfigureAwait(false);
				bUpdateAvailable = riInstalled?.InstallerDigest != null && !string.Equals(riInstalled.InstallerDigest, riLatest.InstallerDigest, System.StringComparison.OrdinalIgnoreCase);
			} else {
				bUpdateAvailable = true;
			}

			return bUpdateAvailable ? new MagicRemoteService.UpdateChecker.UpdateInfo { LatestVersion = riLatest.Tag, ReleaseUrl = riLatest.HtmlUrl } : null;
		}

		private static async System.Threading.Tasks.Task<MagicRemoteService.UpdateChecker.ReleaseInfo> GetReleaseAsync(string strReleasePathSegment) {
			try {
				string strUrl = "https://api.github.com/repos/" + MagicRemoteService.UpdateChecker.RepoOwner + "/" + MagicRemoteService.UpdateChecker.RepoName + "/releases/" + strReleasePathSegment;
				string strJson = await MagicRemoteService.UpdateChecker.hcGitHub.GetStringAsync(strUrl).ConfigureAwait(false);
				using(System.Text.Json.JsonDocument doc = System.Text.Json.JsonDocument.Parse(strJson)) {
					System.Text.Json.JsonElement eRoot = doc.RootElement;
					System.Text.Json.JsonElement? eAsset = MagicRemoteService.UpdateChecker.FindInstallerAsset(eRoot);
					return new MagicRemoteService.UpdateChecker.ReleaseInfo {
						Tag = eRoot.GetProperty("tag_name").GetString(),
						HtmlUrl = eRoot.GetProperty("html_url").GetString(),
						InstallerDigest = eAsset == null ? null : MagicRemoteService.UpdateChecker.GetAssetDigest(eAsset.Value)
					};
				}
			} catch(System.Exception ex) {
				MagicRemoteService.Service.Error("UpdateChecker: failed to fetch release '" + strReleasePathSegment + "': " + ex.Message);
				return null;
			}
		}

		private static System.Text.Json.JsonElement? FindInstallerAsset(System.Text.Json.JsonElement eRelease) {
			if(!eRelease.TryGetProperty("assets", out System.Text.Json.JsonElement eAssets)) {
				return null;
			}
			foreach(System.Text.Json.JsonElement eAsset in eAssets.EnumerateArray()) {
				string strName = eAsset.GetProperty("name").GetString();
				if(strName != null && strName.StartsWith(MagicRemoteService.UpdateChecker.InstallerAssetPrefix, System.StringComparison.OrdinalIgnoreCase) && strName.EndsWith(".exe", System.StringComparison.OrdinalIgnoreCase)) {
					return eAsset;
				}
			}
			return null;
		}

		// GitHub computes and publishes this sha256 digest for every release asset,
		// so checking it costs one small JSON request - no need to download the
		// installer itself just to hash it.
		private static string GetAssetDigest(System.Text.Json.JsonElement eAsset) {
			return eAsset.TryGetProperty("digest", out System.Text.Json.JsonElement eDigest) ? eDigest.GetString() : null;
		}

		private static string GetInstalledVersion() {
			Microsoft.Win32.RegistryKey rkMagicRemoteService = (MagicRemoteService.Program.bElevated ? Microsoft.Win32.Registry.LocalMachine : Microsoft.Win32.Registry.CurrentUser).OpenSubKey(@"Software\MagicRemoteService");
			return rkMagicRemoteService?.GetValue("Version") as string;
		}
	}
}
