require "/bundle/setup"

require "ruby-next/language"

SOURCE = <<~'RUBY'
  greet = proc do
    case it
      in hello: hello if hello =~ /human/i
        '🙂'
      in hello: 'martian'
        '👽'
      end
  end

  puts greet.call(hello: 'martian')
RUBY

puts RubyNext::Language.transform(SOURCE)
