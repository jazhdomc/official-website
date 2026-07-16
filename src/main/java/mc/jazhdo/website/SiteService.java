package mc.jazhdo.website;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.commonmark.parser.Parser;
import org.commonmark.renderer.html.HtmlRenderer;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.ui.Model;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpServletRequest;

@Service
public class SiteService {
    // Function for storing page objects
    public static class Page {
        public final String folder, name, end, display;
        public final List<String> shown;

        public Page(String folder, String name, String end, String display, List<String> shown) {
            this.folder = folder;
            this.name = name;
            this.end = end;
            this.display = display;
            this.shown = shown;
        }
    }

    private final Parser markdownParser = Parser.builder().build();
    private final HtmlRenderer htmlRenderer = HtmlRenderer.builder().build();

    private static final Map<String, List<Page>> PAGES = new LinkedHashMap<>();
    static {
        PAGES.put("jazhdomc", List.of(
            new Page("", "home", "html", "Home", List.of("")),
            new Page("", "rules", "md", "Rules", List.of("")),
            new Page("", "staff", "html", "Staff", List.of("")),
            new Page("", "help", "html", "FAQ", List.of("")),
            new Page("", "sources", "md", "Sources", List.of("")),
            new Page("guides/", "starter", "md", "Starter Guide", new ArrayList<>()),
            new Page("guides/", "moderator", "md", "Moderator Guide", new ArrayList<>()),
            new Page("guides/", "developer", "md", "Developer Guide", new ArrayList<>()),
            new Page("", "changelog", "md", "Changelog", List.of("")),
            new Page("", "login", "html", "Login", new ArrayList<>()),
            new Page("", "profile", "html", "Profile", List.of("")),
            new Page("", "dashboard", "html", "Dashboard", new ArrayList<>()),
            new Page("", "privacy", "html", "Privacy Policy", new ArrayList<>()),
            new Page("", "terms", "html", "Terms of Service", new ArrayList<>()),
            new Page("", "error", "html", "Error", List.of())
        ));
    }

    // Hostnames & Sites
    private static final Map<String, String> HOSTNAMES = new LinkedHashMap<>();
    static {
        HOSTNAMES.put("mc.itsjaz.com", "jazhdomc");
        HOSTNAMES.put("localhost", "jazhdomc");
    }

    /**
     * Returns a formatted error page
     * 
     * @param code The error cocde
     * @param msg The error message
     * @return The ByteArrayResource instance to use
     */
    public ByteArrayResource getError(int code, String msg) {
        return new ByteArrayResource(("Error " + Integer.toString(code) + ":\n" + msg).getBytes());
    }

    /**
     * Loads a resource page
     * 
     * @param page The page to load
     * @param request A HttpServletRequest instance
     * @return The resource
     */
    public Resource loadResource(String page, HttpServletRequest request) {
        // Confirm site exists and return resource page
        String site = HOSTNAMES.get(request.getServerName());
        if (site == null) {
            log(request, "Error 404: Site not found: " + site);
            return getError(404, "Site not found.");
        }

        // Make sure resource exists
        String pagePath = site + "/" + page;
        ClassPathResource resource = new ClassPathResource("templates/" + pagePath);
        if (resource.exists()) {
            log(request, pagePath);
            return resource;
        } else {
            log(request, "Error 404: Resource not found: " + site + "/" + page);
            return getError(404, "Resource not found.");
        }
    }

    private void log(HttpServletRequest request, String msg) {
        System.out.println("[" + LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS) + "] " + request.getRemoteAddr() + " -> " + msg);
    }

    /**
     * Returns the first Page object from a list of pages that matches the given page nameT
     * 
     * @param list The list to search in for the page
     * @param pageName The name of the page to look for
     * @return The found Page object, or null
     */
    private Page getPage(List<Page> list, String folder, String pageName) {
        for (Page page : list) 
            if (page.folder.equalsIgnoreCase(folder) && page.name.equalsIgnoreCase(pageName)) 
                return page;
        return null;
    }

    /**
     * Removes all the hidden pages from a list
     * 
     * @param folder The folder to validate against
     * @param list The list to go through
     * @return The finished list
     */
    private List<Page> removeHidden(String folder, List<Page> list) {
        List<Page> hiddenRemoved = new ArrayList<>(list);
        for (Page page : list) if (!page.shown.contains(folder)) hiddenRemoved.remove(page);
        return hiddenRemoved;
    }

    /**
     * Wraps the main loadPage function with throwing a error set to false
     * 
     * @param page The name of the page to load
     * @param request A HttpServletRequest instance
     * @param model The page model
     * @return The dynamically built page's layout file
     */
    public String loadPage(String page, HttpServletRequest request, Model model) {
        return loadPage(page, request, model, false);
    }

    /**
     * Loads a specified page
     * 
     * @param pageName The name of the page to load
     * @param request A HttpServletRequest instance
     * @param model The page model
     * @return The dynamically built page's layout file
     */
    public String loadPage(String pageName, HttpServletRequest request, Model model, boolean throwError) {
        // Confirm site exists
        String site = HOSTNAMES.get(request.getServerName());
        if (site == null) {
            log(request, "Error 404: Site not found.");
            if (throwError) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Site not found");
            else return loadErrorPage(404, "Site not found", request, model);
        }

        // Confirm site has valid pages
        List<Page> sitePages = PAGES.get(site);
        if (sitePages == null) {
            log(request, "Error 404: Site pages not found.");
            if (throwError) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Site not found");
            else return loadErrorPage(404, "Site pages not found", request, model);
        }

        // Confirm page exists
        Page page;
        if (pageName.contains("/")) {
            String[] pageParts = pageName.split("/");
            page = getPage(sitePages, pageParts[0] + "/", pageParts[1]);
        } else page = getPage(sitePages, "", pageName);
        if (page == null) {
            log(request, "Error 404: Page not found.");
            if (throwError) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Page not found");
            else return loadErrorPage(404, "Page not found", request, model);
        }
        
        // Get the content to display
        String content;
        String type = page.end;
        try {
            // Get the raw string data from the target file
            ClassPathResource resource = new ClassPathResource("templates/" + site + "/" + page.folder + page.name + "." + type);
            String raw = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);

            // Check for markdown
            if (type.equals("md")) {
                content = htmlRenderer.render(markdownParser.parse(raw));
            } else content = raw;
        } catch (IOException e) {
            log(request, "Error 500: Could not load page.");
            if (throwError) throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not load page");
            else return loadErrorPage(500, "Could not load page", request, model);
        }

        // Get navigation menu
        model.addAttribute("navPages", removeHidden(pageName.contains("/") ? pageName.split("/")[0] + "/" : "", sitePages));

        // Set content
        model.addAttribute("content", content);

        // Add differentiating appearance for current page
        model.addAttribute("currentPage", page);

        // Return the right layout file
        String pagePath = site + "/" + page.folder;
        log(request, pagePath + page.name + "." + page.end);
        return pagePath + "layout";
    }

    /**
     * A variation of loadPage for loading error pages
     * 
     * @param status The error code
     * @param errorMsg The error message
     * @param request A HttpServletRequest instance
     * @param model The page model
     * @return The dynamically built error page's file
     */
    private String loadErrorPage(Integer status, String errorMsg, HttpServletRequest request, Model model) {
        // Get layout with page
        String layout = loadPage("error", request, model, true);

        // Fill in status and error fields
        String content = (String) model.getAttribute("content");
        content = content.replace("{{status}}", String.valueOf(status != null ? status : 500));
        content = content.replace("{{error}}", errorMsg != null ? errorMsg : "An unknown error occurred.");
        
        // Save
        model.addAttribute("content", content);

        // Return finished page
        return layout;
    }
}
